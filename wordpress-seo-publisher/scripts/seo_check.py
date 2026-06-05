#!/usr/bin/env python3
"""
seo_check.py — deterministic Yoast-aligned SEO checks for a draft before publishing.

Usage:
  python3 seo_check.py --file body.md --keyword "ai governance" \
      --title "AI Governance: The Homework No Vendor Does" \
      --meta "Buying autonomous AI agents? AI governance is the homework no vendor does for you. Here's what to check first." \
      --slug "ai-governance-vendor-homework"

Exit code 0 if no FAIL, 1 if any FAIL. WARNs never fail the run.
No third-party dependencies.
"""
import argparse
import re
import sys

STOPWORDS = {"a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "with", "is", "are"}


def strip_markdown(text):
    text = re.sub(r"`{1,3}.*?`{1,3}", " ", text, flags=re.S)   # code
    text = re.sub(r"!\[.*?\]\(.*?\)", " ", text)                # images
    text = re.sub(r"\[(.*?)\]\(.*?\)", r"\1", text)             # links -> anchor text
    text = re.sub(r"[#>*_~\-]+", " ", text)                      # md punctuation
    return text


def words(text):
    return re.findall(r"[A-Za-z0-9']+", text.lower())


def count_phrase(haystack_words, phrase):
    kw = phrase.lower().split()
    if not kw:
        return 0
    n = 0
    for i in range(len(haystack_words) - len(kw) + 1):
        if haystack_words[i:i + len(kw)] == kw:
            n += 1
    return n


def first_paragraph(md):
    for block in re.split(r"\n\s*\n", md.strip()):
        b = block.strip()
        if b and not b.startswith("#"):
            return b
    return ""


def h2_lines(md):
    return [m.group(1).strip() for m in re.finditer(r"^##\s+(.*)$", md, flags=re.M)]


def line(status, label, detail):
    icon = {"PASS": "PASS", "WARN": "WARN", "FAIL": "FAIL"}[status]
    print(f"[{icon}] {label}: {detail}")
    return status


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", required=True)
    ap.add_argument("--keyword", required=True)
    ap.add_argument("--title", required=True)
    ap.add_argument("--meta", required=True)
    ap.add_argument("--slug", required=True)
    args = ap.parse_args()

    with open(args.file, encoding="utf-8") as f:
        md = f.read()

    kw = args.keyword.strip().lower()
    body_words = words(strip_markdown(md))
    total = len(body_words)
    statuses = []

    # Keyword density
    occ = count_phrase(body_words, kw)
    density = (occ * len(kw.split()) / total * 100) if total else 0
    if total == 0:
        statuses.append(line("FAIL", "Density", "body is empty"))
    elif density < 0.5:
        statuses.append(line("WARN", "Density", f"{density:.2f}% ({occ}x) — below 0.5%, under-optimized"))
    elif density > 2.5:
        statuses.append(line("WARN", "Density", f"{density:.2f}% ({occ}x) — above 2.5%, risks stuffing"))
    else:
        statuses.append(line("PASS", "Density", f"{density:.2f}% ({occ}x in {total} words)"))

    # SEO title length + keyword
    tlen = len(args.title)
    if kw not in args.title.lower():
        statuses.append(line("FAIL", "Title keyword", "focus keyword not in SEO title"))
    elif tlen > 60:
        statuses.append(line("WARN", "Title length", f"{tlen} chars — over 60, may truncate in search"))
    else:
        statuses.append(line("PASS", "Title", f"{tlen} chars, keyword present"))

    # Meta description length + keyword
    mlen = len(args.meta)
    if kw not in args.meta.lower():
        statuses.append(line("FAIL", "Meta keyword", "focus keyword not in meta description"))
    elif mlen > 155:
        statuses.append(line("WARN", "Meta length", f"{mlen} chars — over 155, may truncate"))
    elif mlen < 70:
        statuses.append(line("WARN", "Meta length", f"{mlen} chars — under 70, too short to be useful"))
    else:
        statuses.append(line("PASS", "Meta", f"{mlen} chars, keyword present"))

    # Slug
    slug = args.slug.strip().lower()
    if not re.fullmatch(r"[a-z0-9-]+", slug):
        statuses.append(line("FAIL", "Slug format", "use lowercase letters, numbers and hyphens only"))
    elif "-".join(w for w in kw.split() if w not in STOPWORDS) not in slug:
        statuses.append(line("WARN", "Slug keyword", "focus keyword not clearly in slug"))
    else:
        statuses.append(line("PASS", "Slug", slug))

    # Keyword in first paragraph
    fp = first_paragraph(md).lower()
    statuses.append(line("PASS" if kw in fp else "WARN", "First paragraph",
                         "keyword present" if kw in fp else "keyword not in opening paragraph"))

    # Keyword in an H2
    has = any(kw in h.lower() for h in h2_lines(md))
    statuses.append(line("PASS" if has else "WARN", "H2 keyword",
                         "keyword in a subheading" if has else "keyword in no H2 subheading"))

    fails = sum(1 for s in statuses if s == "FAIL")
    warns = sum(1 for s in statuses if s == "WARN")
    print(f"\nSummary: {len(statuses) - fails - warns} PASS, {warns} WARN, {fails} FAIL")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
