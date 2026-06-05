#!/usr/bin/env python3
"""
publish.py — create a WordPress post via the REST API and set Yoast SEO meta.

Reads credentials from environment variables:
  WP_SITE_URL       e.g. https://example.com   (no trailing slash)
  WP_USERNAME
  WP_APP_PASSWORD   the Application Password (spaces are fine)

Usage:
  python3 publish.py --file body.md --keyword "ai governance" \
     --seo-title "AI Governance: The Homework No Vendor Does" \
     --meta "Buying autonomous AI agents? Here's the homework no vendor does for you." \
     --slug "ai-governance-vendor-homework" \
     --status draft [--title "Post Title"] [--tags 4,9] [--categories 3]

Notes:
- Default --status is draft. Pass --status publish ONLY on explicit user instruction.
- Setting Yoast meta requires the companion mu-plugin (reference/yoast-rest-meta.php).
- Markdown -> HTML uses the `markdown` package if available, otherwise a minimal converter.
- Standard library only for the HTTP call (urllib); no requests dependency.
"""
import argparse
import base64
import json
import os
import re
import sys
import urllib.request
import urllib.error


def md_to_html(md):
    try:
        import markdown  # optional, nicer output if installed
        return markdown.markdown(md, extensions=["extra"])
    except Exception:
        pass
    # Minimal fallback: headings, bold, italics, links, paragraphs.
    out = []
    for block in re.split(r"\n\s*\n", md.strip()):
        b = block.strip()
        if not b:
            continue
        m = re.match(r"^(#{1,6})\s+(.*)$", b)
        if m:
            lvl = len(m.group(1))
            out.append(f"<h{lvl}>{inline(m.group(2))}</h{lvl}>")
        else:
            out.append(f"<p>{inline(b)}</p>")
    return "\n".join(out)


def inline(t):
    t = re.sub(r"\[(.*?)\]\((.*?)\)", r'<a href="\2">\1</a>', t)
    t = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"\*(.*?)\*", r"<em>\1</em>", t)
    return t.replace("\n", "<br>")


def load_credentials():
    """Env vars win; otherwise read wp-credentials.json from the skill root or alongside this script."""
    keys = ("WP_SITE_URL", "WP_USERNAME", "WP_APP_PASSWORD")
    creds = {k: os.environ.get(k, "") for k in keys}
    if all(creds.values()):
        return creds
    here = os.path.dirname(os.path.abspath(__file__))
    for path in (os.path.join(here, "..", "wp-credentials.json"),
                 os.path.join(here, "wp-credentials.json")):
        if os.path.exists(path):
            try:
                with open(path, encoding="utf-8") as f:
                    data = json.load(f)
                for k in keys:
                    if not creds[k] and data.get(k):
                        creds[k] = data[k]
            except Exception as e:
                sys.exit(f"ERROR: could not read {path}: {e}")
            break
    return creds


def first_h1(md):
    m = re.search(r"^#\s+(.*)$", md, flags=re.M)
    return m.group(1).strip() if m else None


def strip_leading_h1(md):
    return re.sub(r"^#\s+.*\n+", "", md, count=1, flags=re.M)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", required=True)
    ap.add_argument("--keyword", required=True)
    ap.add_argument("--seo-title", required=True)
    ap.add_argument("--meta", required=True)
    ap.add_argument("--slug", required=True)
    ap.add_argument("--title", help="Post title; defaults to the file's H1")
    ap.add_argument("--status", default="draft", choices=["draft", "publish", "pending", "private"])
    ap.add_argument("--tags", default="")
    ap.add_argument("--categories", default="")
    args = ap.parse_args()

    creds = load_credentials()
    site = creds.get("WP_SITE_URL", "").rstrip("/")
    user = creds.get("WP_USERNAME", "")
    pw = creds.get("WP_APP_PASSWORD", "")
    if not (site and user and pw):
        sys.exit("ERROR: missing credentials. Either set WP_SITE_URL, WP_USERNAME, WP_APP_PASSWORD "
                 "as environment variables, or fill wp-credentials.json in the skill folder.")

    with open(args.file, encoding="utf-8") as f:
        md = f.read()

    post_title = args.title or first_h1(md) or args.seo_title
    body_md = strip_leading_h1(md) if first_h1(md) else md
    html = md_to_html(body_md)

    payload = {
        "title": post_title,
        "slug": args.slug,
        "status": args.status,
        "content": html,
        "excerpt": args.meta,
        "meta": {
            "_yoast_wpseo_focuskw": args.keyword,
            "_yoast_wpseo_title": args.seo_title,
            "_yoast_wpseo_metadesc": args.meta,
        },
    }
    if args.tags.strip():
        payload["tags"] = [int(x) for x in args.tags.split(",") if x.strip()]
    if args.categories.strip():
        payload["categories"] = [int(x) for x in args.categories.split(",") if x.strip()]

    token = base64.b64encode(f"{user}:{pw}".encode()).decode()
    req = urllib.request.Request(
        f"{site}/wp-json/wp/v2/posts",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Basic {token}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        sys.exit(f"ERROR {e.code}: {body}")
    except urllib.error.URLError as e:
        sys.exit(f"ERROR: could not reach {site} — {e.reason}")

    pid = data.get("id")
    print(f"OK: post {pid} created with status '{args.status}'.")
    print(f"View:  {data.get('link')}")
    print(f"Edit:  {site}/wp-admin/post.php?post={pid}&action=edit")
    # Warn if Yoast meta did not round-trip (mu-plugin missing)
    got = (data.get("meta") or {})
    if got.get("_yoast_wpseo_focuskw") != args.keyword:
        print("WARN: Yoast focus keyword did not save via REST. Install reference/yoast-rest-meta.php "
              "in wp-content/mu-plugins/ and set the fields in the editor, or re-run after installing it.")


if __name__ == "__main__":
    main()
