-- ============================================================================
-- 06: ROW LEVEL SECURITY (RLS) & ACCESS CONTROL
-- Restricts public browser access; permits service_role / server proxy access
-- ============================================================================

-- Enable RLS on all operational tables
alter table public.companies enable row level security;
alter table public.company_policies enable row level security;
alter table public.roles enable row level security;
alter table public.candidates enable row level security;
alter table public.coach_sessions enable row level security;
alter table public.hr_actions_audit enable row level security;

-- Policy: Allow read-only access to open roles for all users
create policy "Public can read open roles"
  on public.roles
  for select
  to anon, authenticated
  using (is_open = true);

-- Policy: Allow read-only access to companies for all users
create policy "Public can read companies"
  on public.companies
  for select
  to anon, authenticated
  using (true);

-- Policy: Full access for service_role (used by n8n or Next.js server route handlers)
create policy "Service role full access on companies"
  on public.companies for all to service_role using (true) with check (true);

create policy "Service role full access on company_policies"
  on public.company_policies for all to service_role using (true) with check (true);

create policy "Service role full access on roles"
  on public.roles for all to service_role using (true) with check (true);

create policy "Service role full access on candidates"
  on public.candidates for all to service_role using (true) with check (true);

create policy "Service role full access on coach_sessions"
  on public.coach_sessions for all to service_role using (true) with check (true);

create policy "Service role full access on hr_actions_audit"
  on public.hr_actions_audit for all to service_role using (true) with check (true);
