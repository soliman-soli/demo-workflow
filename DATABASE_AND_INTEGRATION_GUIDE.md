# Database Schema, Supabase Setup & n8n Workflow Integration Guide

This guide covers everything you need to:
1. Provision a PostgreSQL / **Supabase** database using the ready-to-run SQL schema in [`supabase/schema.sql`](./supabase/schema.sql).
2. Connect **Supabase** to either your **n8n workflows** or directly to the **Next.js server layer**.
3. Wire all **9 n8n webhooks** to the Next.js portal (`/api/hr/*`).

---

## 1. SQL Database Schema & Migration Files

Even though the default demo architecture stores data via n8n in Google Sheets, moving to **Supabase (PostgreSQL)** gives you strict types, indexes, vector search (`pgvector`), and audit logs.

The SQL code is provided in both **modular separate migration files** (in [`supabase/migrations/`](./supabase/migrations/)) and as a **single combined script** ([`supabase/schema.sql`](./supabase/schema.sql)).

### Modular Files (`supabase/migrations/`)

| File | Purpose | Key Objects |
|---|---|---|
| [`01_extensions.sql`](./supabase/migrations/01_extensions.sql) | Enables cryptographic functions and vector math | `pgcrypto`, `vector` |
| [`02_companies_and_policies.sql`](./supabase/migrations/02_companies_and_policies.sql) | Companies, policy sections with vector index, and aggregate view | `companies`, `company_policies`, `company_policy_counts` |
| [`03_roles.sql`](./supabase/migrations/03_roles.sql) | Open positions and requirements | `roles` |
| [`04_candidates.sql`](./supabase/migrations/04_candidates.sql) | Candidate status enum, applications table, update trigger, pipeline stats view | `candidate_status`, `candidates`, `candidate_pipeline_stats` |
| [`05_coach_and_audit.sql`](./supabase/migrations/05_coach_and_audit.sql) | Career coach session log and recruiter action audit log | `coach_sessions`, `hr_actions_audit` |
| [`06_security_rls.sql`](./supabase/migrations/06_security_rls.sql) | Row Level Security policies for anon and service_role | Table RLS & security policies |
| [`07_seed_data.sql`](./supabase/migrations/07_seed_data.sql) | Initial companies, policies, roles, and sample candidates | Seed data matching demo state |

### Combined Script (`supabase/schema.sql`)
If you prefer running everything in a single step in the **Supabase SQL Editor**, use [`supabase/schema.sql`](./supabase/schema.sql).

### Summary of Tables & Views

| Object | Type | Purpose | Maps to Endpoint |
|---|---|---|---|
| `public.companies` | Table | Stores company names selectable in **Ask HR** | `GET /hr/companies` |
| `public.company_policies` | Table | Stores policy sections, titles, text & `vector(768)` embeddings | `POST /hr/policies/add`, `POST /hr/chat` |
| `public.company_policy_counts` | View | Aggregates `{ name, policy_count }` per company | `GET /hr/companies` |
| `public.roles` | Table | Open job roles with JSONB `requirements` array | `GET /hr/roles` |
| `public.candidates` | Table | Screened job applicants, scores, AI reports, interview times | `POST /hr/apply`, `GET /hr/candidates`, `POST /hr/action` |
| `public.candidate_pipeline_stats` | View | Computes `{ total, review, shortlisted, rejected, interview_invited, avg_score }` | `GET /hr/candidates` |
| `public.coach_sessions` | Table | Optional log of Career Coach CV analyses | `POST /hr/coach` |
| `public.hr_actions_audit` | Table | Audit log of every recruiter `invite_interview` and `reject` action | `POST /hr/action` |

### Core SQL Definitions

```sql
-- Enum matching CandidateStatusSchema in src/lib/hr/schemas.ts
create type public.candidate_status as enum (
  'review',
  'shortlisted',
  'rejected',
  'rejected_by_hr',
  'interview_invited'
);

-- Candidates table matching CandidateSchema
create table public.candidates (
  candidate_id text primary key default ('cand-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  submitted_at timestamptz not null default now(),
  name text not null,
  email text not null,
  linkedin text not null,
  role_id text references public.roles(id) on delete set null,
  role text not null,
  score int check (score is null or (score >= 0 and score <= 100)),
  status public.candidate_status not null default 'review',
  fit_label text not null default 'Pending Review',
  summary text not null default '',
  strengths jsonb not null default '[]'::jsonb,           -- string[]
  gaps jsonb not null default '[]'::jsonb,                -- string[]
  red_flags jsonb not null default '[]'::jsonb,           -- string[]
  interview_questions jsonb not null default '[]'::jsonb, -- [{ question, probes }]
  recommendation text not null default '',
  auto_email text not null default '',
  cv_storage_path text,
  interview_at text,
  interview_mode text check (interview_mode in ('online', 'onsite')),
  interview_location text,
  interview_note text,
  updated_at timestamptz not null default now()
);
```

---

## 2. How to Link Supabase to Your System

You have **two architectural ways** to use Supabase with this portal:

### Option A (Recommended): Connect Supabase Inside n8n
Keep Next.js as a stateless security proxy (`Browser -> Next.js /api/hr/* -> n8n -> Supabase`) and replace the Google Sheets nodes in n8n with **Supabase** or **Postgres** nodes:
1. In your Supabase dashboard, go to **Project Settings → API** and copy:
   - **Project URL** (`https://xyzcompany.supabase.co`)
   - **`service_role` secret key** (never expose this in the browser)
2. In **n8n**, go to **Credentials → Add Credential → Supabase API** (or **Postgres** using the connection string from **Project Settings → Database**).
3. Replace your Google Sheets read/write nodes with Supabase nodes pointing to `companies`, `company_policies`, `roles`, and `candidates`.

### Option B: Connect Supabase Directly in Next.js Route Handlers
If you want Next.js to read/write fast read-only endpoints (`GET /api/hr/roles`, `GET /api/hr/companies`, `GET /api/hr/candidates`) directly from Supabase while only using n8n for AI & email workflows:

1. **Install the Supabase client**:
   ```bash
   npm install @supabase/supabase-js
   ```
2. **Add Supabase variables to `.env.local`** (server-only, no `NEXT_PUBLIC_` prefix):
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. **Create `src/lib/supabase/server.ts`**:
   ```ts
   import { createClient } from "@supabase/supabase-js";

   export function getSupabaseAdmin() {
     const url = process.env.SUPABASE_URL;
     const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
     if (!url || !key) {
       throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
     }
     return createClient(url, key, {
       auth: { persistSession: false, autoRefreshToken: false },
     });
   }
   ```
4. **Query inside any route handler** (for example `src/app/api/hr/roles/route.ts`):
   ```ts
   const supabase = getSupabaseAdmin();
   const { data: roles, error } = await supabase
     .from("roles")
     .select("id, title, department, location, type, summary, requirements")
     .eq("is_open", true)
     .order("created_at", { ascending: true });
   ```

---

## 3. How to Link the n8n Workflows with the Portal

### Step 1: Configure Webhook Authentication in n8n
Every request from Next.js (`src/lib/hr/n8n-fetch.ts`) sends the header:
```http
X-API-KEY: <your N8N_WEBHOOK_KEY>
```
In **every n8n Webhook node**:
1. Set **Authentication** to `Header Auth`.
2. Create or select a Header Auth credential:
   - **Name**: `X-API-KEY`
   - **Value**: The exact same random secret string you put in `N8N_WEBHOOK_KEY` in `.env.local` and Vercel.
3. Set **Respond** to `Using 'Respond to Webhook' Node` (so your workflow can finish Gemini/Sheets/Supabase work and return structured JSON).

### Step 2: Set Your `.env.local` in Next.js
Create `.env.local` in the project root:
```env
# Base URL of your production n8n webhook endpoint (no trailing slash)
N8N_BASE_URL=https://your-n8n-domain.com/webhook

# Shared secret sent in the X-API-KEY header
N8N_WEBHOOK_KEY=your-strong-shared-secret

# Recruiter passcode for /projects/hr-system/hr
HR_DEMO_PASSCODE=your-recruiter-passcode

# Set to "false" to call real n8n webhooks (or "true" for offline mock mode)
USE_MOCKS=false
```

> **Important (n8n Test vs. Production URLs):**
> - In n8n, **active** workflows listen on `https://<host>/webhook/...`
> - When clicking "Listen for test event" in the n8n editor, n8n listens on `https://<host>/webhook-test/...`
> - Always **Activate** all 9 workflows in n8n when pointing `N8N_BASE_URL` to `/webhook`.

---

### Step 3: Exact Webhook Contracts for All 9 Endpoints

All responses are validated by Zod schemas in [`src/lib/hr/schemas.ts`](./src/lib/hr/schemas.ts). Ensure your **Respond to Webhook** node in n8n returns the exact JSON keys below.

#### 1. Health Check
- **Next.js Route**: `GET /api/hr/health`
- **n8n Webhook Path**: `GET /hr/health`
- **Expected n8n Response (`200 OK`)**:
  ```json
  {
    "status": "live",
    "time": "2026-11-08T18:00:00.000Z"
  }
  ```

#### 2. List Companies (Ask HR)
- **Next.js Route**: `GET /api/hr/companies`
- **n8n Webhook Path**: `GET /hr/companies`
- **Expected n8n Response (`200 OK`)**:
  ```json
  {
    "companies": [
      { "name": "Demo Co", "policy_count": 12 },
      { "name": "TechStart Inc", "policy_count": 5 }
    ]
  }
  ```

#### 3. Add Company Policies (Ask HR)
- **Next.js Route**: `POST /api/hr/policies`
- **n8n Webhook Path**: `POST /hr/policies/add`
- **Incoming Format**: `multipart/form-data`
  - Text mode fields: `company` (string), `title` (string), `text` (string)
  - PDF mode fields: `company` (string), `file` (binary PDF file)
- **Expected n8n Response (`200 OK`)**:
  ```json
  {
    "ok": true,
    "added": 7,
    "company": "Demo Co"
  }
  ```

#### 4. Ask HR Chat Assistant
- **Next.js Route**: `POST /api/hr/chat`
- **n8n Webhook Path**: `POST /hr/chat`
- **Incoming JSON Body**:
  ```json
  {
    "message": "How many annual leave days do I get?",
    "company": "Demo Co",
    "history": [
      { "role": "user", "content": "Hi" },
      { "role": "assistant", "content": "Hello! How can I help?" }
    ]
  }
  ```
- **Expected n8n Response (`200 OK`)**:
  ```json
  {
    "answer": "Demo Co offers 24 working days of paid annual leave per year.",
    "sources": ["Annual Leave & Time Off Policy 2026"],
    "found": true,
    "follow_ups": [
      "Can I roll over unused leave?",
      "How do I request annual leave?"
    ]
  }
  ```

#### 5. Career Coach (CV Analysis + Cover Letter Email)
- **Next.js Route**: `POST /api/hr/coach`
- **n8n Webhook Path**: `POST /hr/coach`
- **Incoming Format**: `multipart/form-data`
  - Fields: `name`, `email`, `role`, `job_description` (optional)
  - Binary property: `cv` (validated PDF <= 4 MB)
- **Expected n8n Response (`200 OK`)**:
  ```json
  {
    "ok": true,
    "email_notice": "Your cover letter and sample interview answers are on the way.",
    "report": {
      "match_score": 72,
      "verdict": "Strong technical foundation; highlight production scale.",
      "summary": "Your CV shows solid hands-on experience...",
      "strengths": [
        { "title": "Modern Full-Stack Proficiency", "evidence": "Built Next.js apps..." }
      ],
      "gaps": [
        {
          "title": "Production Metrics",
          "why_it_matters": "Recruiters look for quantified impact.",
          "how_to_fix": "Add latency and throughput numbers to your top bullets."
        }
      ],
      "focus_next": ["Add testing section", "Quantify project impact"],
      "interview_questions": [
        {
          "question": "How do you handle webhook retries?",
          "type": "System Architecture",
          "why_asked": "Tests reliability mindset."
        }
      ]
    }
  }
  ```

#### 6. List Open Roles (Apply & Coach Suggestions)
- **Next.js Route**: `GET /api/hr/roles`
- **n8n Webhook Path**: `GET /hr/roles`
- **Expected n8n Response (`200 OK`)**:
  ```json
  {
    "roles": [
      {
        "id": "role-swe-cairo",
        "title": "Full-Stack Software Engineer",
        "department": "Engineering",
        "location": "Cairo, Egypt (Hybrid)",
        "type": "Full-time",
        "summary": "Join our core product team...",
        "requirements": ["3+ years TypeScript", "PostgreSQL"]
      }
    ]
  }
  ```

#### 7. Submit Job Application (Apply)
- **Next.js Route**: `POST /api/hr/apply`
- **n8n Webhook Path**: `POST /hr/apply`
- **Incoming Format**: `multipart/form-data`
  - Fields: `name`, `email`, `linkedin`, `role_id`
  - Binary property: `cv` (validated PDF <= 4 MB)
- **Expected n8n Response (`200` or `202`)**:
  ```json
  {
    "ok": true,
    "message": "Application received. You'll hear back by email within 48 hours."
  }
  ```
  *(Note: Even if n8n computes the AI score synchronously, Next.js strips everything except `{ ok, message }` so the applicant never sees the score or decision).*

#### 8. List Candidates & Stats (Recruiter Dashboard)
- **Next.js Route**: `GET /api/hr/candidates` *(Protected by `hr_session` cookie)*
- **n8n Webhook Path**: `GET /hr/candidates`
- **Expected n8n Response (`200 OK`)**:
  ```json
  {
    "stats": {
      "total": 5,
      "review": 1,
      "shortlisted": 1,
      "rejected": 2,
      "interview_invited": 1,
      "avg_score": 69
    },
    "candidates": [
      {
        "candidate_id": "cand-001",
        "submitted_at": "2026-11-08T16:00:00.000Z",
        "name": "Tarek Mostafa",
        "email": "tarek.mostafa@example.com",
        "linkedin": "https://linkedin.com/in/tarekmostafa-dev",
        "role": "Full-Stack Software Engineer",
        "score": 88,
        "status": "shortlisted",
        "fit_label": "Exceptional Match",
        "summary": "4 years of TypeScript and Next.js experience...",
        "strengths": ["Strong TypeScript"],
        "gaps": ["Limited n8n custom node exposure"],
        "red_flags": [],
        "interview_questions": [
          {
            "question": "How do you handle schema migrations?",
            "probes": "Look for zero-downtime migration patterns."
          }
        ],
        "recommendation": "Immediate technical interview.",
        "auto_email": "Auto-shortlisted email sent.",
        "updated_at": "2026-11-08T16:05:00.000Z",
        "interview_at": null
      }
    ]
  }
  ```

#### 9. Recruiter Action — Invite or Reject (Recruiter Dashboard)
- **Next.js Route**: `POST /api/hr/action` *(Protected by `hr_session` cookie)*
- **n8n Webhook Path**: `POST /hr/action`
- **Incoming JSON Body**:
  ```json
  {
    "candidate_id": "cand-001",
    "action": "invite_interview",
    "interview_at": "Sun 9 Nov 2026, 11:00 (Cairo time)",
    "mode": "online",
    "location": "https://meet.google.com/dem-o-hr",
    "note": "30-minute technical walkthrough."
  }
  ```
- **Expected n8n Response (`200 OK`)**:
  ```json
  {
    "ok": true,
    "candidate_id": "cand-001",
    "status": "interview_invited",
    "interview_at": "Sun 9 Nov 2026, 11:00 (Cairo time)"
  }
  ```

