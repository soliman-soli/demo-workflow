# Tasks

- [x] Configure warm paper light (`#F6F3EE`) and dark (`#14181A`) CSS variables in `src/app/globals.css`
- [x] Implement `src/site.config.ts` with single-source personal copy and project metadata
- [x] Build Portfolio Home (`src/app/page.tsx`) and SVG project thumbnails
- [x] Build Zod schemas (`src/lib/hr/schemas.ts`), `n8nFetch` (`src/lib/hr/n8n-fetch.ts`), and PDF magic-byte validator (`src/lib/hr/file-validation.ts`)
- [x] Build all `/api/hr/*` routes (`health`, `chat`, `companies`, `policies`, `coach`, `roles`, `apply`, `candidates`, `action`, `login`, `logout`)
- [x] Build HR Demo landing page (`src/app/projects/hr-system/page.tsx`)
- [x] Build Ask HR (`src/features/ask/*`), Career Coach (`src/features/coach/*`), Apply (`src/features/apply/*`), and Recruiter Dashboard (`src/features/hr/*`)
- [x] Write Vitest unit tests and Playwright E2E smoke tests
- [x] Author `supabase/schema.sql` and `DATABASE_AND_INTEGRATION_GUIDE.md`
- [x] Add Dawaa Pharmacy schemas, image validator (JPEG/PNG/WebP <= 5 MB), and n8n workflow simulator engine (`src/lib/pharmacy/*`)
- [x] Add `/api/pharmacy/*` routes (`message`, `decision`, `state`, `reset`) reusing `n8nFetch` and `checkRateLimit`
- [x] Build Dawaa Pharmacy 3-column simulator, Google Sheet viewer, case study, and home card (`/projects/pharmacy-system`)
- [x] Author n8n deliverables in `docs/pharmacy/` (`customer-message.workflow.json`, `pharmacist-decision.workflow.json`, `expire-reservations.workflow.json`, `google-sheet-schema.md`, `catalog-seed.csv`, `README.md`)
- [x] Implement Fenjan Café thin-client portal (`/projects/fenjan-cafe`), `/api/fenjan/*` proxy routes, `sitemap.ts`, 3rd home card, and route handler unit tests

