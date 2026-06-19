# Aegis — Deployment Guide

Self-contained instructions to host the Aegis MCP backend on a remote server and
expose it to Claude as a remote custom connector. Written so an agent (e.g.
Claude Code running on the server) can execute it end to end.

---

## What you need on the server

- **Linux host** with a public IP or domain.
- **Python 3.10+** (`python3 --version`).
- **A domain + HTTPS** — Claude custom connectors require a public **HTTPS** URL.
  Either a reverse proxy (Caddy/nginx) terminating TLS, or a platform that gives
  you HTTPS automatically (Render/Railway/Fly).
- **Outbound HTTPS** only if you enable the optional LLM judge (calls the
  Anthropic API). The MCP endpoint itself only needs **inbound** 443.
- **The Aegis backend code + catalogue data** (see "Get the files on the server").
- Optional: **Docker** if you prefer containers over a systemd service.

Ports: the app listens on `8000` by default (`AEGIS_PORT`); the proxy exposes
`443` → `8000`. The MCP endpoint path is **`/mcp`**.

---

## Get the files on the server

You need two things from this repo:

1. `aegis/backend/` — the server code.
2. `data/` — the catalogue (`principles.json`) and `data/sections/*/rubric.json`
   (the rubrics, needed by `review_against_standard`).

Either clone the repo, or copy just those two directories. Keep the relative
layout, or set `AEGIS_DATA_DIR` to wherever `data/` lands.

```bash
# example: copy from your machine to the server
scp -r ai_principles_server/aegis  user@server:/opt/aegis-app/
scp -r ai_principles_server/data   user@server:/opt/aegis-app/
# result: /opt/aegis-app/aegis/backend  and  /opt/aegis-app/data
```

> The `data/` directory is the IP. Lock down its permissions; it is read by the
> app and never served wholesale.

---

## Option A — systemd service (plain VPS)

```bash
cd /opt/aegis-app/aegis/backend
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
```

Create `/etc/systemd/system/aegis.service`:

```ini
[Unit]
Description=Aegis MCP server
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/aegis-app/aegis/backend
Environment=AEGIS_TRANSPORT=streamable-http
Environment=AEGIS_HOST=127.0.0.1
Environment=AEGIS_PORT=8000
Environment=AEGIS_DATA_DIR=/opt/aegis-app/data
# Optional automated judge (keep the key off the client):
# Environment=AEGIS_ANTHROPIC_API_KEY=sk-ant-...
# Optional API-key auth (see "Auth" below):
# Environment=AEGIS_API_KEY=choose-a-long-secret
ExecStart=/opt/aegis-app/aegis/backend/.venv/bin/python -m aegis.server
Restart=on-failure
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now aegis
sudo systemctl status aegis      # should be active (running)
curl -sS localhost:8000/mcp -X POST \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | head
```

Bind to `127.0.0.1` and let the proxy handle the internet (next section).

---

## Option B — Docker

Create `aegis/backend/Dockerfile`:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY aegis/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY aegis/backend /app
COPY data /data
ENV AEGIS_TRANSPORT=streamable-http \
    AEGIS_HOST=0.0.0.0 \
    AEGIS_PORT=8000 \
    AEGIS_DATA_DIR=/data
EXPOSE 8000
CMD ["python", "-m", "aegis.server"]
```

Build + run from the **repo root** (so both `aegis/` and `data/` are in context):

```bash
docker build -f aegis/backend/Dockerfile -t aegis:latest .
docker run -d --name aegis -p 8000:8000 \
  -e AEGIS_API_KEY=choose-a-long-secret \
  aegis:latest
```

---

## Expose over HTTPS (reverse proxy)

### Caddy (simplest — auto TLS)

`/etc/caddy/Caddyfile`:

```
aegis.yourdomain.com {
    reverse_proxy 127.0.0.1:8000
}
```

```bash
sudo systemctl reload caddy
```

Your connector URL is then `https://aegis.yourdomain.com/mcp`.

### nginx (if you already run it)

```nginx
server {
    server_name aegis.yourdomain.com;
    listen 443 ssl;   # add your certs / certbot lines
    location /mcp {
        proxy_pass http://127.0.0.1:8000/mcp;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Host $host;
        proxy_buffering off;          # MCP streams; don't buffer
        proxy_read_timeout 3600s;
    }
}
```

---

## Auth (do this before sharing the URL)

An open `/mcp` lets anyone with the URL call your tools. Two options:

1. **At the proxy** — quickest. Require a header in Caddy/nginx and reject
   without it. Example (Caddy):

   ```
   aegis.yourdomain.com {
       @noauth not header Authorization "Bearer choose-a-long-secret"
       respond @noauth 401
       reverse_proxy 127.0.0.1:8000
   }
   ```

   In the Claude connector dialog, add the header / OAuth accordingly.

2. **In the app** — set `AEGIS_API_KEY` and add a check (small middleware) in
   `server.py`. Tell me if you want this wired in; it's a ~15-line addition.

This auth layer is also your future billing meter (per-org keys → usage).

---

## Point Claude at it

In the target account: Settings → Connectors → **Add custom connector** →
URL = `https://aegis.yourdomain.com/mcp` → (Advanced) add the auth header/OAuth →
**Add**.

Test: "Which standards apply to an Agentic RAG project?" / "Map the guardrails
for an agent." Claude calls the Aegis tools; the catalogue stays on the server.

---

## Verify (the checklist)

- [ ] `systemctl status aegis` (or `docker ps`) shows it running.
- [ ] Local `tools/list` curl returns the five tool names.
- [ ] `https://aegis.yourdomain.com/mcp` resolves with a valid cert.
- [ ] Unauthenticated request returns 401 (if auth is on).
- [ ] Connector added in Claude; a test prompt triggers a tool call.
- [ ] `AEGIS_DATA_DIR` points at a `data/` with `principles.json` +
      `sections/*/rubric.json`; `catalogue_info()` returns the right count (23).

---

## Updating the catalogue later

Replace `data/principles.json` (and rubrics) on the server, then restart:
`sudo systemctl restart aegis` (or `docker restart aegis`). The loader caches in
memory, so a restart is what picks up changes.
