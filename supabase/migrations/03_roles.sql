-- ============================================================================
-- 03: OPEN ROLES (FOR APPLY & CAREER COACH)
-- Stores job postings and requirements
-- Powers: GET /hr/roles
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

create index if not exists idx_roles_is_open on public.roles (is_open);

