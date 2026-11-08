# Soliman — Portfolio & AI-Powered HR System Demo

Personal engineering portfolio for **Soliman** featuring a live, end-to-end **HR Demo** (`Ask HR`, `Career Coach`, `Apply for a Role`, and a passcode-protected `Recruiter Dashboard`) backed by **n8n** workflows and a strict **Next.js App Router** security proxy layer.

---

## Architecture Overview

```text
Browser  ──►  Next.js Route Handlers (/api/hr/*)  ──►  n8n Webhooks (X-API-KEY)
              • Zod input & output validation          • Gemini AI (Q&A, CV screening)
              • %PDF- magic-byte & 4 MB file checks    • Google Sheets / Supabase DB
              • Per-IP rate limiting (Upstash/Memory)  • Gmail automated emails
              • Jose HS256 httpOnly recruiter cookie
```

The browser **never** talks to n8n directly and **never** sees `N8N_BASE_URL` or `N8N_WEBHOOK_KEY`.

---

## Routes

| Route | Description |
|---|---|
| `/` | Portfolio home: Hero, Projects grid (`HR Demo` live card + 3 in-progress cards), About, Contact |
| `/projects/hr-system` | HR Demo case study, live n8n health indicator, screening rules table, and 3 demo entry cards |
| `/projects/hr-system/ask` | **Ask HR**: Policy Q&A chat with company selector, FAQ chips, source citations, and "Add company policies" modal |
| `/projects/hr-system/coach` | **Career Coach**: Upload a PDF CV to receive a match score, strengths, gaps, focus list, and interview questions |
| `/projects/hr-system/apply` | **Apply**: Browse open roles, submit an application with PDF CV (never reveals internal score/decision) |
| `/projects/hr-system/hr` | **Recruiter Gate**: Passcode login (`HR_DEMO_PASSCODE`) that issues an 8-hour signed `httpOnly` cookie |
| `/projects/hr-system/hr/dashboard` | **Recruiter Dashboard**: Pipeline stats, filters, candidate drawer, interview invite modal with live email preview, and CSV export |

---

## Getting Started Locally

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
N8N_BASE_URL=https://your-n8n-host/webhook
N8N_WEBHOOK_KEY=your-api-key-here
HR_DEMO_PASSCODE=demo-recruiter-2024
USE_MOCKS=true

# Optional: Cloudflare Turnstile
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=

# Optional: Upstash Redis for distributed rate limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### 3. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## How Mock Mode Works (`USE_MOCKS=true`)

When `USE_MOCKS=true` in `.env.local`:
- Every `/api/hr/*` route handler returns realistic mock data from [`src/lib/hr/mocks.ts`](./src/lib/hr/mocks.ts) without calling n8n.
- **Mutable in-memory session state**: Adding company policies in `/ask` or inviting/rejecting candidates in `/hr/dashboard` updates the in-memory mock store for the life of the server process.
- **Testing error states in Mock Mode**:
  - Send `[fail]` in **Ask HR** chat to trigger a `502` assistant error with an inline retry button.
  - Include `[fail]` in the target role on **Career Coach** to trigger an `{ ok: false, error }` state.
  - Include `[fail]` in the applicant name on **Apply** to trigger a `400` validation error banner.
  - Ask about `stock`, `equity`, or `crypto` in **Ask HR** to trigger the `found: false` ("Not found in policies") state.

---

## Testing & Verification

```bash
# Type-check
npx tsc --noEmit

# Lint
npm run lint

# Unit tests (Vitest: Zod schemas, PDF magic bytes validation, n8nFetch error handling)
npm test

# End-to-end smoke tests (Playwright with USE_MOCKS=true)
npx playwright test
```

---

## Database & n8n Integration Guide

See **[`DATABASE_AND_INTEGRATION_GUIDE.md`](./DATABASE_AND_INTEGRATION_GUIDE.md)** and **[`supabase/schema.sql`](./supabase/schema.sql)** for:
- The complete PostgreSQL / Supabase schema (`companies`, `company_policies`, `roles`, `candidates`, `coach_sessions`, `hr_actions_audit`).
- How to connect Supabase to n8n or directly to Next.js.
- Detailed webhook contracts for all 9 n8n endpoints.

---

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. In **Vercel Project Settings → Environment Variables**, set:
   - `N8N_BASE_URL` = `https://your-n8n-host/webhook`
   - `N8N_WEBHOOK_KEY` = `<your-secret-webhook-key>`
   - `HR_DEMO_PASSCODE` = `<your-recruiter-passcode>`
   - `USE_MOCKS` = `false` (or `true` if showcasing without a live n8n instance)
   - *(Optional)* `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
   - *(Optional)* `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
4. Deploy. All `/api/hr/*` route handlers export `maxDuration = 60` to accommodate 20–40s AI workflows on Vercel.
