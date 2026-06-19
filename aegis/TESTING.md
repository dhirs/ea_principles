# Aegis — Testing Guide

Three ways to test, cheapest first. The third is the one that answers "test it in
another Cowork account."

## The key constraint

A Claude **custom connector reaches your server from Anthropic's cloud, not from
the local machine.** So to use Aegis in *another account*, the server must be
reachable over the **public internet as a remote (HTTP) MCP** — a local stdio
server will not work cross-account.

```
stdio        -> same machine only (Inspector, local plugin)
streamable-http + public URL -> any account, anywhere
```

---

## 1. Local sanity check — MCP Inspector (no Claude needed)

Confirms the tools load and return correct data.

```bash
cd aegis/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Inspector (Node required):
npx @modelcontextprotocol/inspector python -m aegis.server
```

Open the Inspector URL it prints, click a tool (e.g. `get_applicable_standards`),
call it with `paradigms: ["agentic","rag"]`, confirm 23 standards come back.

---

## 2. Your own Claude Desktop — local stdio

Only for testing on *your* machine (Claude Desktop, classic config). Edit the
config file:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "aegis": {
      "command": "/ABSOLUTE/PATH/aegis/backend/.venv/bin/python",
      "args": ["-m", "aegis.server"],
      "env": { "AEGIS_DATA_DIR": "/ABSOLUTE/PATH/ai_principles_server/data" }
    }
  }
}
```

Restart Claude Desktop. Ask: "Which standards apply to an Agentic RAG project?"
and it should call the tool.

> Note: this is the local/stdio path. It does **not** make the server available
> to a different account — for that, use option 3.

---

## 3. Another Cowork account — remote HTTP connector

This is the real cross-account test.

### a. Run the server in HTTP mode

```bash
cd aegis/backend
source .venv/bin/activate
AEGIS_TRANSPORT=streamable-http AEGIS_PORT=8000 \
AEGIS_DATA_DIR=/ABSOLUTE/PATH/ai_principles_server/data \
python -m aegis.server
# serves the MCP endpoint at http://0.0.0.0:8000/mcp
```

### b. Expose it on the public internet

Quick test (a temporary public URL over your local server):

```bash
# install ngrok, then:
ngrok http 8000
# copy the https URL it gives you, e.g. https://abc123.ngrok-free.app
# your MCP endpoint is that URL + /mcp
#   -> https://abc123.ngrok-free.app/mcp
```

For something persistent instead of ngrok, deploy the backend to any host that
gives you an HTTPS URL (Render, Railway, Fly.io, a VPS behind Caddy/nginx). Same
endpoint path: `/mcp`.

### c. Add it as a custom connector in the other account

In the other Claude/Cowork account:

1. Settings → Connectors → **Add custom connector**
2. Paste the remote MCP URL: `https://<your-public-host>/mcp`
3. (Optional) Advanced settings → OAuth client id/secret if you add auth
4. Click **Add**

Then in that account: "Which standards apply to an Agentic RAG project?" /
"Map the guardrails for an agent." Claude will call the Aegis tools over the
connector. The catalogue files stay on your server; only the derived results
cross the wire.

### Sanity-check the endpoint by hand

```bash
curl -sS -X POST https://<your-public-host>/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

You should see the five tool names listed.

---

## Before you expose it to anyone else: add auth

ngrok + an open `/mcp` means anyone with the URL can call your tools. For a real
test with another person, put auth in front (the OAuth fields in the connector
dialog map to this). That auth layer is also your eventual billing meter — see
`SETUP.md`, "What comes next."
