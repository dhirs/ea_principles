# CLAUDE.md - Project Documentation

## Project Overview
S3 JSON Viewer - A Next.js web application that fetches and displays JSON data from AWS S3 buckets with a modern, responsive UI.

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
- **app/page.tsx**: Mounts `PrinciplesView`
- **app/api/data/route.ts**: S3 fetch wrapped in `unstable_cache` (60s TTL, tag `principles`)
- **app/api/refresh/route.ts**: POST endpoint that calls `revalidateTag('principles')`
- **app/layout.tsx**: Root layout — Inter (sans) + JetBrains Mono (mono) from Google Fonts; composes Header + Sidebar + main + Footer
- **components/layout/**: Header, Sidebar, Footer, RefreshButton
- **components/principles/**: PrinciplesView (fetch + state), PrincipleView (HeaderBar + tabs)
- **components/principles/sections/**: One renderer per top-level principle node (StatementSection, ProblemSection, SolutionSection, GatesSection, FrameworkMappingsSection, EvidenceSection, KeyValueSection, ChangeHistorySection, HeaderBar, UnknownSection)
- **lib/principles/types.ts**: Loose `Principle = Record<string, unknown>` + `asObject/asArray/asString` defensive helpers
- **lib/principles/registry.tsx**: Single source of truth for tab order, titles, and renderer mapping. Unknown top-level keys auto-fall-through to `UnknownSection` (labeled JSON viewer). Tab order: Statement → Problem → Solution → Gates → Ownership → Evidence → Framework Mappings → AIGP → History.
- **components/ui/**: Shadcn/UI components (project-owned — modified in place)

### Resilience pattern (important)
The JSON schema changes often. Section renderers are defensive: each reads its node with `asObject/asArray/asString`, returns `null` when empty, never crashes. Adding a new top-level key to the JSON shows it immediately as a raw-JSON tab with humanised title; promote to a proper renderer by adding one line to `REGISTRY` in `lib/principles/registry.tsx`.

## Known Quirks
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