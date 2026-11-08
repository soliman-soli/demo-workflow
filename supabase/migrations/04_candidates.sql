-- ============================================================================
-- 04: CANDIDATES & RECRUITER PIPELINE
-- Stores screened applications, match scores, AI reports, interview dates
-- Powers: POST /hr/apply, GET /hr/candidates, POST /hr/action
-- ============================================================================

-- Candidate status enum matching CandidateStatusSchema
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

-- Table: candidates
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
  cv_storage_path text,                                   -- Supabase Storage file key
  interview_at text,                                      -- e.g. 'Sun 9 Nov 2026, 11:00 (Cairo time)'
  interview_mode text check (interview_mode in ('online', 'onsite')),
  interview_location text,
  interview_note text,
  updated_at timestamptz not null default now()
);

-- Indexes for dashboard filtering and sorting
create index if not exists idx_candidates_status on public.candidates (status);
create index if not exists idx_candidates_submitted_at on public.candidates (submitted_at desc);
create index if not exists idx_candidates_score on public.candidates (score desc nulls last);
create index if not exists idx_candidates_role on public.candidates (role);

-- Auto-update updated_at timestamp on row modification
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

-- View: candidate_pipeline_stats
-- Directly powers the stats cards in the recruiter dashboard (GET /hr/candidates)
create or replace view public.candidate_pipeline_stats as
select
  count(*)::int as total,
  count(*) filter (where status = 'review')::int as review,
  count(*) filter (where status = 'shortlisted')::int as shortlisted,
  count(*) filter (where status in ('rejected', 'rejected_by_hr'))::int as rejected,
  count(*) filter (where status = 'interview_invited')::int as interview_invited,
  coalesce(round(avg(score))::int, 0) as avg_score
from public.candidates;

