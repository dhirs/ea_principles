# SEO Rubric (Yoast-aligned)

The thresholds `seo_check.py` enforces. PASS = good; WARN = allowed but flag to the user; FAIL = do not publish without explicit override.

## Focus keyword
One phrase, 2–4 words, that the post should rank for. It must be genuinely supported by the body — do not pick a keyword the article doesn't actually deliver on. It must appear in all of:

- SEO title
- Meta description
- URL slug
- The first paragraph
- At least one H2 subheading

## Keyword density
Occurrences x keyword-word-count / total body words.

- **< 0.5%** — WARN, under-optimized (the keyword barely appears).
- **0.5%–2.5%** — PASS.
- **> 2.5%** — WARN, risks keyword stuffing (Yoast penalizes this).

Density is computed on body prose only — code blocks, image markup, and link URLs are stripped; link anchor text is kept.

## SEO title
- ≤ 60 characters (longer truncates in Google results) — over = WARN.
- Focus keyword present, ideally near the front — missing = FAIL.
- Reads like a headline a human would click, not a keyword list.

## Meta description
- 70–155 characters — outside = WARN.
- Focus keyword present exactly once — missing = FAIL.
- Ends with a reason to click (benefit, question, or stakes).

## Slug
- Lowercase letters, numbers, hyphens only — otherwise FAIL.
- Contains the focus keyword with stopwords (a/the/and/of) dropped — otherwise WARN.
- Short: aim for 3–6 words.

## Images (manual, if the post has any)
- Each meaningful image has alt text.
- The keyword appears in at least one alt text where it reads naturally.

## What this rubric does NOT cover
Readability scoring (sentence length, passive voice, transition words) is left to Yoast's own analysis in the editor. This skill guarantees the structural/keyword signals; the human does the final readability pass on the draft before hitting Publish.
