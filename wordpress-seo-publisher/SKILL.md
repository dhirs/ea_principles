---
name: wordpress-seo-publisher
description: Use when the user wants to publish or post written content (a blog post, article, draft, op-ed) to their WordPress site with SEO optimization — deciding a focus keyword, checking keyword density, and writing the SEO title, meta description, and URL slug for Yoast SEO. Triggers include "post this to my blog", "publish to WordPress", "put this on my site", "optimize this and post it", "push this to my site as a draft", or any request to send finished writing to WordPress. Do NOT trigger for writing or editing the content itself — only for the SEO-and-publish step once the prose is agreed.
---

# WordPress SEO Publisher

Sends finished writing to the user's WordPress site as a **draft by default**, with Yoast SEO fields populated and a deterministic SEO checklist enforced before anything is posted. Nothing is published live unless the user explicitly says so in the current turn.

## What this skill does and does not decide

It does NOT write the article. The body text is agreed with the user first (in chat or in a `.md` file). This skill takes settled prose and handles: focus keyword, keyword density, SEO title, meta description, slug, heading/keyword placement, and the REST publish call.

## One-time setup — confirm this is done before the first publish

The publish path uses the WordPress REST API with an Application Password. Before the first run, confirm with the user that all three are in place; if not, walk them through it:

1. **Application Password.** In WordPress: Users -> Profile -> Application Passwords -> add one named "Claude Publisher". Copy the generated password (spaces included).
2. **Yoast REST meta plugin.** Yoast's focus keyword / SEO title / meta description are NOT writable through the stock REST API. Install the one-file companion at `reference/yoast-rest-meta.php` into `wp-content/mu-plugins/` (create the folder if missing). This exposes the three Yoast meta keys to REST so the script can set them. One-time. Without it, the post still publishes but the Yoast fields stay blank.
3. **Credentials as environment variables** (never hard-code them):
   - `WP_SITE_URL` (e.g. `https://example.com` — no trailing slash)
   - `WP_USERNAME`
   - `WP_APP_PASSWORD`
   See `reference/config.example.json` for the shape. Prefer env vars over a file.

## Workflow — strict order

1. **Settle the body first.** Do not start SEO work until the user is happy with the prose. If the text is still being edited, stay there.

2. **Choose the focus keyword *with* the user.** One short phrase (2–4 words) the post should rank for. Propose 2–3 candidates grounded in the article's actual topic and let the user pick. Do not invent a keyword the body doesn't support.

3. **Run the SEO check.** `python3 scripts/seo_check.py --file <body.md> --keyword "<phrase>" --title "<seo title>" --meta "<meta desc>" --slug "<slug>"`. It prints PASS / WARN / FAIL per check (density, title length, meta length, keyword in first paragraph, keyword in an H2, keyword in slug). Revise the title/meta/slug/body until everything is PASS, or until the user explicitly accepts a WARN. Never publish on a FAIL without the user's say-so.

4. **Show the final SEO package in chat** — focus keyword, SEO title (with char count), meta description (with char count), slug — and get a clear go-ahead.

5. **Publish as draft.** `python3 scripts/publish.py --file <body.md> --keyword "<phrase>" --seo-title "<title>" --meta "<meta>" --slug "<slug>" --status draft [--tags id,id] [--categories id,id]`. The script converts markdown to HTML, creates the post, and sets the Yoast meta.

6. **Hand back the edit link.** Report the returned `wp-admin/post.php?post=<id>&action=edit` URL so the user can do a final review and hit Publish. Only pass `--status publish` if the user explicitly asked to go live this turn.

## SEO rules (Yoast-aligned) — full detail in `reference/seo_rubric.md`

- **Focus keyword** appears in: SEO title, meta description, URL slug, the first paragraph, and at least one H2.
- **Keyword density** between 0.5% and 2.5% of total words. Below = under-optimized; above = stuffing (Yoast flags both).
- **SEO title** ≤ 60 characters, focus keyword near the front, reads like a headline a human would click.
- **Meta description** ≤ 155 characters, includes the focus keyword once, ends with a reason to click.
- **Slug** short, lowercase, hyphenated, contains the keyword, drops stopwords (a/the/and/of).
- **Images** (if any) carry alt text containing the keyword where natural.

## Safety

- Default status is `draft`. Live publishing requires an explicit instruction in the same turn.
- Never echo `WP_APP_PASSWORD` back into chat or write it into any committed file.
- If the REST call returns 401/403, the Application Password or username is wrong — stop and tell the user; do not retry blindly.
