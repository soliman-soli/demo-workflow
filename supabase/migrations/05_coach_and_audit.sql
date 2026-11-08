-- ============================================================================
-- 05: CAREER COACH & HR ACTION AUDIT LOGS
-- Audit tables for candidate actions and career coach analyses
-- Powers: POST /hr/coach, POST /hr/action
-- ============================================================================

-- Table: coach_sessions
-- Logs career coach CV submissions and report summaries for analytics
create table if not exists public.coach_sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  target_role text not null,
  match_score int not null check (match_score >= 0 and match_score <= 100),
  verdict text not null,
  report jsonb not null, -- Stores full CoachReport JSON
  created_at timestamptz not null default now()
);

create index if not exists idx_coach_sessions_created_at
  on public.coach_sessions (created_at desc);

-- Table: hr_actions_audit
-- Immutable audit log tracking every recruiter interview invite and rejection
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

create index if not exists idx_hr_actions_audit_candidate_id
  on public.hr_actions_audit (candidate_id);
create index if not exists idx_hr_actions_audit_created_at
  on public.hr_actions_audit (created_at desc);
