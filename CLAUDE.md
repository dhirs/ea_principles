# CLAUDE.md - Project Documentation
you need to reduce the amount of fart you give when I ask you questions. I prefer concise answers, be as concise as possible when you respond.

## Project Overview
S3 JSON Viewer - A Next.js web application that fetches and displays JSON data from AWS S3 buckets with a modern, responsive UI.

> **App root is `s3-json-viewer/`.** `package.json`, `node_modules`, `.env.local`, and the real `app/` (with `api/`, `layout.tsx`, `standards/`, `principles/`) all live there. Run `npm run dev` / `npm run build` from inside `s3-json-viewer/`, not the repo root. The root-level `app/page.tsx` is a stray leftover and is NOT what the dev server serves.

## Second app: CRM (leads + events) — separate from this one
There are **two apps** in this repo. This CLAUDE.md is about the **principles app** (`s3-json-viewer/`, port 3000). The other is our **own CRM** — leads + Maven events/attendance, Supabase-backed — living in **`hubspot/ui/`** (port 3001; `./scripts/start_supabase_ui.sh`). Despite the folder name it uses **zero HubSpot API** — `hubspot/` is a legacy misnomer; we build our own CRM. Its full docs are **`hubspot/ui/crm.md`** (tables `leads` / `maven_events` / `maven_attendance`, the pages/API routes, and the `hubspot/load_maven_attendance.py` CSV importer); **build/run/deploy + env + login-gate instructions are in `hubspot/BUILD.md`**. Read those before touching CRM code. It's **login-gated** (`middleware.ts` + `lib/auth.ts`, single hardcoded user); secrets (`SUPABASE_*`, `CRM_SESSION_SECRET`) live in the gitignored repo-root `.env`, loaded via `next.config.ts`. Leads are always upserted via the PostgREST URL (`ignore-duplicates`, `on_conflict=email`), never psql.

## Data model: standards vs principles (IMPORTANT — read before touching data code)
The S3 JSON top-level key is **`standards`** (was `principles`). Each node carries BOTH `standard_id` (e.g. `ST-GO1B1-01`) and `principle_id` (e.g. `PR-GO1B1-01`) — the model is **many standards per principle**. A node's principle "title" is the `u_principle` field (aspirational statement); `statement.title` is the *standard's* title.
- **`standard_id` is the node id** used for routing, lookup, search, and the detail-page header. Code reading the S3 object must use `data.standards` and find by `standard_id`.
- **Routes:** `/standards` = list of all standards (cards); `/standards/<standard_id>` = detail; `/standards/<standard_id>/reference` = RI README. `/principles` = principle→standards **mapping** page (groups standards by `principle_id`).
- **Bare-id mismatch (gotcha):** RI dirs (`data/ri/GO1B1-01/`) and `dependencies[].principle_id` (`GO1B1-01`) use the **bare** form, while node ids are prefixed (`ST-`/`PR-`). `/api/ri` strips a leading `ST-`/`PR-` before resolving the dir; `DependenciesSection` normalises bare → `ST-` form for its links.
- **`/api/index` response key stays `principles`** (internal payload shape `{ meta, principles: [...] }`) even though it lists standards — context/dashboard read `data.principles`. Don't confuse this with the S3 `data.standards` key. Each index entry carries `standard_id`, `principle_id`, `u_principle`, `pillar`, `focus_area`, `maturity_level`, etc. The index **trims `framework_mappings`** to just what the sidebar filters need: `aws.references[].best_practice` and `nist.references[].{category,subcategory}` (NIST `note`/`function`/`mapping_state` are dropped to keep the payload light — read the full S3 object for those).
  - **Framework-mapping state (read before touching framework code):** the schema is deliberately vendor-neutral — `framework_mappings` is keyed by framework and built to hold AWS / AIGP / NIST / OWASP / EU AI Act / etc. without schema change (see `data/taxonomy.json` + `data/principle_schema.json` `framework_mappings_spec`). **AWS is the sole primary anchor**; everything else is a cross-reference (informational, no enforcement). **Currently *populated* in `principles.json`: `aws` (24/24), `aigp` (23/24, missing `ST-GO1B1-04`), `eu_ai_act` (7/24 — the 6 Security standards + `GO1B1-01`, all `mapping_state: unverified`).** `eu_ai_act` was *added* alongside AIGP on 2026-06-14 — it did **not** replace NIST. **`nist` is populated on zero standards** — it was never filled in, not removed. So the index's `nist` extraction and the two `Nist*Filter` sidebar widgets are **intentional scaffolding** for a planned-but-not-yet-populated cross-reference (NIST AI RMF is also earmarked as a tier-3 source for the future `u_principle` anchoring pass — see `decisions.md`). They render empty until NIST mappings are authored; **do not delete them.** Conversely, the live `aigp` and `eu_ai_act` mappings are **not yet surfaced as filters** (no `Aigp*`/`EuAiAct*` widgets) — adding those is open work, not a bug.
  - **Per-framework WHY/HOW docs (`data/framework_mappings/`) — read before adding or editing any framework mapping.** Each framework (`aws`, `aigp`, `eu_ai_act`, `nist`, `gdpr`, future `fca` …) has a document explaining *why* we map to it and *how* the mapping is derived. The registry + the **"How to add a new framework"** procedure live in `data/framework_mappings/README.md`; the doc template is `data/framework_mappings/_TEMPLATE.md`. This folder is the human-reasoning layer; the machine-readable field shapes/conventions stay in `data/taxonomy.json` (`framework_mappings_spec`) and the per-AWS-BP ledger stays in `data/lens_mapping.md`. **To add a framework, follow the README procedure — it's designed so no CLAUDE.md edit is needed per framework (just a new `<key>.md` + a registry row).** The one rule across all frameworks: a standard earns a reference only when its *gate actually discharges* the framework's obligation, never by mere topical relation.
- New top-level keys `u_value` / `u_principle` are consumed by `HeaderBar` (listed in `HEADER_KEYS` in `registry.tsx`, so they're not stray tabs).

## Tech Stack
- **Framework:** Next.js 16.2.6 with App Router
- **Node.js:** v20.20.2+ (minimum required, v26.2.0 also tested)
- **Styling:** Tailwind CSS v4 with Shadcn/UI components
- **Cloud:** AWS S3 (using @aws-sdk/client-s3)
- **Deployment Target:** Vercel

## Dependencies
### Core Dependencies
- next: 16.2.6
- react: Latest
- react-dom: Latest
- @aws-sdk/client-s3: 3.x
- react-markdown: 10.x (renders Reference Implementation READMEs)
- remark-gfm: 4.x (GFM tables/strikethrough/etc. for react-markdown)

### UI/Styling
- tailwindcss: 4.x
- @tailwindcss/postcss: Latest
- shadcn/ui components:
  - card
  - tabs
  - accordion
  - badge
  - skeleton
  - button

### Development Dependencies
- typescript: Latest
- @types/node: Latest
- @types/react: Latest
- eslint: Latest
- eslint-config-next: Latest

## Environment Variables Required
```env
# AWS Configuration (.env.local)
AWS_ACCESS_KEY_ID=<your_access_key>
AWS_SECRET_ACCESS_KEY=<your_secret_key>
AWS_REGION=ap-south-1
S3_BUCKET_NAME=datawhistl
S3_JSON_KEY=ea/principles.json
```

## Known Issues & Solutions

### 1. Node.js Version Requirement
**Issue:** Next.js 16.2.6 requires Node.js >=20.9.0
**Solution:** Installed nvm and upgraded to Node.js v20.20.2 or v26.2.0
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
# Install and use Node 20
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
nvm alias default 20
```

### 2. Tailwind CSS Native Binding Error
**Issue:** Error: Cannot find module '@tailwindcss/oxide-linux-x64-gnu'
**Root Cause:** Tailwind CSS v4 uses native bindings that need to be properly installed
**Solution:** 
```bash
# Clean reinstall dependencies
rm -rf node_modules package-lock.json .next
npm install
```

### 3. Hydration Mismatch Warning
**Issue:** Browser extensions (Grammarly, ColorZilla) add attributes to HTML elements causing hydration mismatches
**Solution:** Added `suppressHydrationWarning` to html and body tags in app/layout.tsx
```tsx
<html suppressHydrationWarning>
  <body suppressHydrationWarning>
```

### 4. Accordion Component Type Error
**Issue:** Shadcn/UI Accordion component API doesn't support 'type' and 'collapsible' props in this version
**Solution:** Removed unsupported props from Accordion component usage

## Development Commands
```bash
# Start development server (ensure Node 20+ is active)
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && nvm use 20
npm run dev

# Build for production
npm run build

# Clean build
rm -rf .next node_modules package-lock.json && npm install
```

## API Structure
### /api/data Route
- Fetches JSON from S3 using AWS SDK
- Returns parsed JSON data
- Handles errors with appropriate status codes

### /api/ri/[id] Route
- Serves the Reference Implementation README for a standard: reads `<repo-root>/data/ri/<bare-id>/README.md`.
- These files live at the **repo root**, OUTSIDE the app dir, so they are not static assets. The route resolves them via `path.join(process.cwd(), '..', 'data', 'ri', id, 'README.md')` (`process.cwd()` is `s3-json-viewer/`, so `..` is the repo root).
- **Strips a leading `ST-`/`PR-` prefix** from the incoming id first, because RI dirs are named by the bare bp_code (`GO1B1-01`) but callers pass the prefixed `standard_id` (`ST-GO1B1-01`).
- `id` is whitelisted to `^[A-Za-z0-9_-]+$` to block path traversal → returns 400; 404 when the README is missing; 200 with `{ content }` otherwise.
- Supports `HEAD` (Next auto-derives it from `GET`); the Solution tab uses a HEAD request as a cheap existence check.

### /api/taxonomy Route
- Serves the per-principle schema for the Taxonomy page: reads `<repo-root>/data/principle_schema.json` via `path.join(process.cwd(), '..', 'data', 'principle_schema.json')`.
- Returns the parsed JSON (200) or `{ error, details }` (500) if the file can't be read. The `/taxonomy` page flattens `principle_schema.fields` into `level1.level2` dot-path nodes.

### Expected JSON Structure
```json
{
  "title": "Page Title",
  "description": "Optional description",
  "sections": [
    {
      "id": "section1",
      "title": "Section Title",
      "description": "Optional description",
      "type": "accordion|grid|list|text",
      "content": [...]
    }
  ]
}
```

## Component Architecture
- **app/page.tsx**: Dashboard landing — "Welcome back" + per-pillar standards counts and stat cards. Reads `data.principles` (the `/api/index` payload). Does NOT render the catalogue.
- **app/standards/page.tsx**: Standards list — mounts `PrinciplesList` (grid/list of standard cards), linking to `/standards/<standard_id>`.
- **app/standards/[id]/page.tsx**: Detail view — client component; reads `id` via `useParams`, fetches `/api/data/<standard_id>`, renders `PrincipleView`.
- **app/standards/[id]/reference/page.tsx**: Reference Implementation view — fetches `/api/ri/<standard_id>` and renders the README markdown. Linked from the Solution tab.
- **app/principles/page.tsx**: Principle→standards **map** — mounts `PrincipleStandardsMap`. Groups standards by `principle_id`, shows principle id + `u_principle` title beside its standards (each linking to `/standards/<standard_id>`). Has its own pillar + focus-area filter panel (local state, not the sidebar's).
- **app/api/data/route.ts**: S3 fetch wrapped in `unstable_cache` (60s TTL, tag `principles`)
- **app/api/refresh/route.ts**: POST endpoint that calls `revalidateTag('principles')`
- **app/layout.tsx**: Root layout — Inter (sans) + JetBrains Mono (mono) from Google Fonts; wraps Header + Sidebar + main + Footer inside `<PrinciplesProvider>` so every route shares the same fetch + search state.
- **components/layout/**: Header, Footer, RefreshButton, and the `sidebar/` widget folder.
- **components/layout/sidebar/**: Widget folder — `Sidebar.tsx` (shell), `SidebarMenu.tsx` (nav: Dashboard → `/`, All Principles → `/principles`, All Standards → `/standards`, Taxonomy → `/taxonomy`), `SearchPrinciples.tsx` (search input), `PillarFilter`/`FocusAreaFilter`/`MaturityFilter`/`BestPracticeFilter`/`NistCategoryFilter`/`NistSubCategoryFilter` (sidebar dropdowns), `index.ts` (re-exports `Sidebar`). Each widget is its own file; add new ones here and mount in `Sidebar.tsx`. The two NIST dropdowns **cascade**: `NistSubCategoryFilter`'s options are scoped to the category chosen in `NistCategoryFilter` (the provider clears a stale subcategory when the category changes). A standard matches if **any** of its NIST references hits the selected category/subcategory. **Note:** no standard currently carries `framework_mappings.nist`, so these two dropdowns render empty today — they are intentional scaffolding for a planned cross-reference framework, not dead code (see the framework-mapping-state note in the data-model section). Keep them.
- **components/principles/**: `PrincipleView` (HeaderBar + tabs, full width), `PrinciplesList` (standard cards used by `/standards`), `PrincipleStandardsMap` (the `/principles` mapping view). `PrinciplesView` is a deprecated wrapper, no longer mounted.
- **components/principles/sections/**: One renderer per top-level node (StatementSection, ProblemSection, SolutionSection, GatesSection, DependenciesSection, FrameworkMappingsSection, EvidenceSection, KeyValueSection, ChangeHistorySection, HeaderBar, MetaSection). `HeaderBar` shows `standard_id` (with `principle_id` + `u_value`/`u_principle`). `SolutionSection` HEAD-checks `/api/ri/<standard_id>` and renders a "Reference Implementation" link to `/standards/<standard_id>/reference` only when the README exists.
- **components/principles/markdownComponents.tsx**: Tailwind styling map passed to `react-markdown` (no `@tailwindcss/typography` plugin is installed, so each element — headings, lists, code, tables, etc. — is styled explicitly here). Shared by the reference-implementation page.
- **lib/principles/PrinciplesContext.tsx**: Client `PrinciplesProvider` + `usePrinciples()` hook. Fetches **`/api/index`** once on mount; exposes `{ data, error, query, setQuery, filtered, pillar/focusArea/maturityLevel/bestPractice/nistCategory/nistSubcategory (+setters & option lists) }`. `data.principles` is the index payload. `filtered` matches query against `statement.title` + `standard_id` and applies the sidebar dropdown filters. Selecting a sidebar filter calls `router.push("/standards")`. Sidebar widgets and pages read/write through this hook — do NOT refetch in components.
- **lib/principles/types.ts**: Loose `Principle = Record<string, unknown>` + `asObject/asArray/asString` defensive helpers
- **lib/principles/registry.tsx**: Single source of truth for tab order, titles, and renderer mapping. Unknown top-level keys auto-fall-through to `UnknownSection` (labeled JSON viewer). Tab order: Statement → Problem → Solution → Gates → Ownership → Evidence → Framework Mappings → AIGP → History.
- **components/ui/**: Shadcn/UI components (project-owned — modified in place)

### State pattern (important)
All cross-route principle state lives in `PrinciplesProvider` (mounted in `app/layout.tsx`). The search input writes `query`; the list page and any future widgets read `filtered`. Don't add per-component `useEffect(fetch...)` calls — extend the provider instead.

### Resilience pattern (important)
The JSON schema changes often. Section renderers are defensive: each reads its node with `asObject/asArray/asString`, returns `null` when empty, never crashes. Adding a new top-level key to the JSON shows it immediately as a raw-JSON tab with humanised title; promote to a proper renderer by adding one line to `REGISTRY` in `lib/principles/registry.tsx`.

## Known Quirks
- **The app reads from S3, not `data/principles.json`.** The local `data/principles.json` is a working copy; the running app fetches the object at `S3_BUCKET_NAME`/`S3_JSON_KEY`. If the UI shows stale/empty data after a local edit, the S3 object hasn't been re-uploaded (or the 60s cache hasn't expired / Refresh button not hit). Verify the live shape by curling `/api/index`, not by reading the local file.
- **Tailwind v4 + `@layer base`**: putting `font-size` (or other plain CSS properties) inside `@layer base { html { ... } }` silently fails to compile into the served CSS. Use a top-level `html { ... }` rule instead. See `app/globals.css` for the base font-size override.
- **`AWS_PRINCIPLES_PATH` in `/home/dheeraj/ai_principles_server/.env`** is unused; the API route reads `S3_BUCKET_NAME` and `S3_JSON_KEY` from `s3-json-viewer/.env.local`. Don't waste time editing the outer `.env`.
- **Node version**: project runs on Node 22 (set as nvm default globally). Do not `nvm use 20` — it's stale guidance from the earlier setup.

## Caching
- Server-side: `unstable_cache(fetchPrinciplesFromS3, ['principles-json'], { revalidate: 60, tags: ['principles'] })` in `app/api/data/route.ts`.
- Browser/CDN: `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.
- Force-refresh: the **Refresh** button in the header POSTs `/api/refresh` (which calls `revalidateTag`), then `window.location.reload()`.

## Deployment Notes
### Vercel Deployment
1. Ensure all environment variables are set in Vercel dashboard
2. Node.js version will be automatically detected from package.json engines
3. Build command: `npm run build`
4. Output directory: `.next`

### Security Considerations
- Never commit .env.local or AWS credentials
- Use IAM roles with minimal permissions for S3 access
- Consider implementing request signing for production
- S3 bucket should have appropriate CORS settings if accessed directly

## Testing Checklist
- [ ] Page loads without errors
- [ ] Data fetches from S3 successfully
- [ ] All section types render correctly (accordion, grid, list, text)
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Error states display properly
- [ ] Loading skeleton shows during data fetch

## Future Improvements
- Add caching for S3 data
- Implement incremental static regeneration (ISR)
- Add data refresh functionality
- Consider using AWS CloudFront for better performance
- Add authentication if needed
- Implement search/filter functionality for large datasets

## Troubleshooting Commands
```bash
# Check Node version
node --version  # Should be >= 20.9.0

# Check for port conflicts
lsof -i :3000

# Clear all caches
rm -rf .next node_modules package-lock.json
npm cache clean --force
npm install

# Run with verbose logging
DEBUG=* npm run dev
```

## Development Environment Setup
1. Clone repository
2. Install Node.js 20+ via nvm
3. Copy .env.local.example to .env.local and fill in AWS credentials
4. Run `npm install`
5. Run `npm run dev`
6. Open http://localhost:3000

## Contact & Support
For issues specific to this implementation, check:
- AWS S3 bucket permissions
- CORS settings on S3
- Network connectivity to AWS
- Node.js version compatibility