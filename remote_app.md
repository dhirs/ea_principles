# Deploy the S3 JSON Viewer (Next.js) on the Hetzner server

Goal: serve the Next.js app (`s3-json-viewer/`) at **https://aegis.datawhistl.com/**, reverse-proxied
by the host nginx to a Docker container on `127.0.0.1:3000`, **without breaking** the existing
`aegis.datawhistl.com/mcp` route.

> This file is written for the Claude Code instance running **on the server** (user `gdev`, with sudo).

---

## Server facts (already verified)
- Host is fully **Docker-based**. Apps live under `/srv/www/<name>/` with a `docker-compose.yml`.
- Host **nginx** reverse-proxies each site to `127.0.0.1:<port>`.
- `aegis.datawhistl.com` nginx site **already exists** and has a valid Let's Encrypt cert.
  It currently proxies **only** `location /mcp` → `127.0.0.1:8002`. We will ADD a `location /`
  → `127.0.0.1:3000`. **Do not remove `/mcp`.**
- Host port **3000 is free** (3001 and 3003 are taken; 3000 is not).
- GitHub is already authenticated on the box as `dhirs` (SSH), so the clone works with no token.
- Node/npm are NOT installed on the host — that's fine, the app runs inside the container.

## CRITICAL gotcha — the `../data` path dependency
The app's API routes read files from the **repo root**, OUTSIDE the app dir:
- `/api/ri/[id]` reads `path.join(process.cwd(), '..', 'data', 'ri', <id>, 'README.md')`
- `/api/taxonomy` reads `path.join(process.cwd(), '..', 'data', 'principle_schema.json')`

`process.cwd()` is the app dir (`s3-json-viewer/`), so `..` must be the repo root containing `data/`.
**Therefore do NOT use Next.js `output: 'standalone'`** and **do NOT build only the app subfolder.**
The Docker image must contain the whole repo with this layout preserved:
```
/app/                  <- repo root  (process.cwd()/.. resolves here)
  data/                <- ri/, principle_schema.json, etc.
  s3-json-viewer/      <- WORKDIR, the Next.js app  (process.cwd())
```
Run `next start` from `/app/s3-json-viewer` so `..` = `/app`.

## Use a glibc base image (not Alpine)
Tailwind v4 uses native bindings (`@tailwindcss/oxide-linux-x64-gnu`). Use `node:22-bookworm-slim`
(glibc) so the correct native binding installs. Alpine (musl) causes the oxide binding error.

---

## Steps

### 1. Clone the repo into /srv/www
```bash
sudo mkdir -p /srv/www/ea_principles
sudo chown -R gdev:gdev /srv/www/ea_principles
git clone git@github.com:dhirs/ea_principles.git /srv/www/ea_principles
cd /srv/www/ea_principles
```
Verify the data dir came with the clone (it must, for the RI/taxonomy routes):
```bash
ls data/principle_schema.json && ls -d data/ri | head
```
If `data/` is missing, stop — the RI/taxonomy pages will 404. (It should be committed.)

### 2. Create the app env file `s3-json-viewer/.env.local`
This is gitignored, so it is NOT in the clone — create it. The non-secret values are known;
**the two AWS secret values must be supplied by Dheeraj** (ask him, or copy from his laptop).
```bash
cat > /srv/www/ea_principles/s3-json-viewer/.env.local <<'EOF'
AWS_ACCESS_KEY_ID=<ASK_DHEERAJ>
AWS_SECRET_ACCESS_KEY=<ASK_DHEERAJ>
AWS_REGION=ap-south-1
S3_BUCKET_NAME=datawhistl
S3_JSON_KEY=ea/principles.json
EOF
chmod 600 /srv/www/ea_principles/s3-json-viewer/.env.local
```
> Tip for Dheeraj: from your laptop you can copy the real file directly:
> `scp s3-json-viewer/.env.local datawhistl:/srv/www/ea_principles/s3-json-viewer/.env.local`

### 3. Add a Dockerfile at the repo root
Create `/srv/www/ea_principles/Dockerfile`:
```dockerfile
FROM node:22-bookworm-slim
WORKDIR /app

# Copy the whole repo so `data/` sits next to the app (the ../data dependency).
COPY . .

# Build the Next.js app
WORKDIR /app/s3-json-viewer
RUN npm ci && npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
# next start; binds 0.0.0.0:3000 inside the container
CMD ["npm", "run", "start"]
```

### 4. Add a .dockerignore at the repo root
Create `/srv/www/ea_principles/.dockerignore` (keep `data/`! do not ignore it):
```
**/node_modules
**/.next
.git
*.svg
paid_workshop
aegis
```

### 5. Add docker-compose.yml at the repo root
Create `/srv/www/ea_principles/docker-compose.yml`:
```yaml
services:
  ea-principles:
    build: .
    image: ea_principles:latest
    container_name: ea_principles
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    env_file:
      - ./s3-json-viewer/.env.local
```

### 6. Build and start
```bash
cd /srv/www/ea_principles
sudo docker compose up -d --build
sudo docker ps --filter name=ea_principles
sudo docker logs --tail=50 ea_principles
```
Smoke-test the container locally (should return JSON, not an error):
```bash
curl -s http://127.0.0.1:3000/api/index | head -c 300; echo
```

### 7. Wire up nginx (add `location /`, keep `/mcp`)
Find the real site file (sites-enabled may be a symlink):
```bash
readlink -f /etc/nginx/sites-enabled/aegis.datawhistl.com
```
Edit that file. Inside the **`server { listen 443 ssl; ... }`** block for `aegis.datawhistl.com`,
**keep the existing `location /mcp { ... }`** and ADD this block alongside it:
```nginx
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 300s;
    }
```
(Order doesn't matter — nginx matches the longest prefix, so `/mcp` still wins for MCP requests.)

Test and reload:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 8. Verify end-to-end
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://aegis.datawhistl.com/
curl -s https://aegis.datawhistl.com/api/index | head -c 300; echo
# confirm MCP still works:
curl -s -o /dev/null -w "%{http_code}\n" https://aegis.datawhistl.com/mcp
```
Then open https://aegis.datawhistl.com/ in a browser.

---

## Redeploy after future code changes
```bash
cd /srv/www/ea_principles
git pull
sudo docker compose up -d --build
```

## Troubleshooting
- **502 Bad Gateway** → container not up or not on :3000. `sudo docker logs ea_principles`.
- **RI / Taxonomy pages 404** → `data/` not inside the image. Confirm `.dockerignore` doesn't
  exclude `data/`, and that `data/` exists in the repo root of the clone.
- **Empty/stale data** → app reads from S3 (`datawhistl` bucket, key `ea/principles.json`), not a
  local file. Check `.env.local` AWS creds; there's a 60s server cache. The header **Refresh**
  button forces a revalidate.
- **Tailwind oxide native error** → you used Alpine; switch base image to `node:22-bookworm-slim`.
- **Build can't reach GitHub during clone** → the box auth is `dhirs` via SSH; `ssh -T git@github.com`
  should say "Hi dhirs!".
