-- ============================================================================
-- HR DEMO SYSTEM — SUPABASE / POSTGRESQL SCHEMA
-- Compatible with Supabase (Postgres 15+) & pgvector for semantic search
-- ============================================================================

-- 1. Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ============================================================================
-- TABLE 1: companies
-- Stores demo organizations selectable in the "Ask HR" chat assistant
-- ============================================================================
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text generated always as (lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))) stored,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- TABLE 2: company_policies
-- Stores chunked company policy sections (and optional embeddings) for Ask HR
-- ============================================================================
create table if not exists public.company_policies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  company_name text not null,
  title text not null,
  section_index int not null default 1,
  content text not null,
  -- Optional 768-dim embedding for Gemini text-embedding-004
  embedding vector(768),
  created_at timestamptz not null default now()
);

create index if not exists idx_company_policies_company_name
  on public.company_policies (company_name);

-- View to power GET /hr/companies -> { companies: [{ name, policy_count }] }
create or replace view public.company_policy_counts as
select
  c.name,
  count(p.id)::int as policy_count
from public.companies c
left join public.company_policies p on p.company_id = c.id
group by c.id, c.name
order by c.name asc;

-- ============================================================================
-- TABLE 3: roles
-- Open job positions returned by GET /hr/roles
-- ============================================================================
create table if not exists public.roles (
  id text primary key, -- e.g. 'role-swe-cairo'
  title text not null,
  department text not null,
  location text not null,
  type text not null default 'Full-time',
  summary text not null,
  requirements jsonb not null default '[]'::jsonb, -- string[]
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- TABLE 4: candidates
-- Job applications screened by AI & managed in the Recruiter Dashboard
-- Matches CandidatesResponseSchema in src/lib/hr/schemas.ts
-- ============================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'candidate_status') then
    create type public.candidate_status as enum (
      'review',
      'shortlisted',
      'rejected',
      'rejected_by_hr',
      'interview_invited'
    );
  end if;
end$$;

create table if not exists public.candidates (
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
  cv_storage_path text,                                   -- Optional Supabase Storage path
  interview_at text,                                      -- e.g. 'Sun 9 Nov 2026, 11:00 (Cairo time)'
  interview_mode text check (interview_mode in ('online', 'onsite')),
  interview_location text,
  interview_note text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_candidates_status on public.candidates (status);
create index if not exists idx_candidates_submitted_at on public.candidates (submitted_at desc);
create index if not exists idx_candidates_score on public.candidates (score desc nulls last);

-- Auto-update updated_at timestamp on row change
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_candidates_updated_at on public.candidates;
create trigger trg_candidates_updated_at
before update on public.candidates
for each row execute function public.touch_updated_at();

-- Helper view for GET /hr/candidates stats object
create or replace view public.candidate_pipeline_stats as
select
  count(*)::int as total,
  count(*) filter (where status = 'review')::int as review,
  count(*) filter (where status = 'shortlisted')::int as shortlisted,
  count(*) filter (where status in ('rejected', 'rejected_by_hr'))::int as rejected,
  count(*) filter (where status = 'interview_invited')::int as interview_invited,
  coalesce(round(avg(score))::int, 0) as avg_score
from public.candidates;

-- ============================================================================
-- TABLE 5: coach_sessions (Optional audit/analytics log for Career Coach)
-- ============================================================================
create table if not exists public.coach_sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  target_role text not null,
  match_score int not null check (match_score >= 0 and match_score <= 100),
  verdict text not null,
  report jsonb not null, -- Full CoachReport JSON
  created_at timestamptz not null default now()
);

-- ============================================================================
-- TABLE 6: hr_actions_audit (Audit trail of recruiter invite/reject actions)
-- ============================================================================
create table if not exists public.hr_actions_audit (
  id uuid primary key default gen_random_uuid(),
  candidate_id text not null references public.candidates(candidate_id) on delete cascade,
  action text not null check (action in ('invite_interview', 'reject')),
  interview_at text,
  mode text,
  location text,
  note text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Lock tables from public anonymous browser access; only service_role (used by
-- n8n or Next.js server route handlers) can read/write.
-- ============================================================================
alter table public.companies enable row level security;
alter table public.company_policies enable row level security;
alter table public.roles enable row level security;
alter table public.candidates enable row level security;
alter table public.coach_sessions enable row level security;
alter table public.hr_actions_audit enable row level security;

-- Allow read access on open roles to anon if desired, or keep everything via service_role:
create policy "Service role has full access to all HR tables"
  on public.candidates
  for all
  to service_role
  using (true)
  with check (true);

-- ============================================================================
-- SEED DATA (Matches Demo Co initial state)
-- ============================================================================
insert into public.companies (name)
values
  ('Demo Co'),
  ('TechStart Inc'),
  ('Apex Logistics')
on conflict (name) do nothing;

insert into public.roles (id, title, department, location, type, summary, requirements)
values
  (
    'role-swe-cairo',
    'Full-Stack Software Engineer',
    'Engineering',
    'Cairo, Egypt (Hybrid)',
    'Full-time',
    'Join our core product team building high-throughput workflow engines, Next.js web applications, and LLM-assisted tools.',
    '["3+ years experience with TypeScript, Next.js, and Node.js", "Proficiency with relational databases (PostgreSQL) and schema design", "Familiarity with workflow automation tools (n8n, Temporal) or queue systems", "Experience building or consuming REST/GraphQL APIs and AI SDKs", "Strong written and verbal English communication"]'::jsonb
  ),
  (
    'role-designer-remote',
    'Senior Product Designer',
    'Product Design',
    'Remote (EMEA timezones)',
    'Full-time',
    'Lead the end-to-end UX/UI for our candidate assessment suite, analytics dashboards, and interactive self-service portals.',
    '["4+ years of product design experience for B2B SaaS applications", "Proven expertise in Figma, design systems, and rapid interactive prototyping", "Deep understanding of accessibility (WCAG AA) and responsive web behavior", "Ability to translate complex workflows into calm, intuitive UI architectures", "Strong portfolio featuring shipped desktop and mobile experiences"]'::jsonb
  ),
  (
    'role-data-cairo',
    'Data Analyst & Automation Specialist',
    'Operations',
    'Cairo, Egypt (On-site / Hybrid)',
    'Full-time',
    'Help us build automated reporting pipelines, audit screening data quality, and optimize internal operations across departments.',
    '["Strong background in SQL, Python data analysis (Pandas), and spreadsheet modeling", "Experience building dashboards in Metabase, PowerBI, or Tableau", "Hands-on experience automating business workflows using n8n or Python scripts", "Sharp attention to detail and ability to spot anomalies in candidate pipelines"]'::jsonb
  )
on conflict (id) do nothing;

