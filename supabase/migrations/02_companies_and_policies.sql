-- ============================================================================
-- 02: COMPANIES & POLICIES (FOR ASK HR)
-- Stores organizations and policy chunks with vector embeddings
-- Powers: GET /hr/companies, POST /hr/policies/add, POST /hr/chat
-- ============================================================================

-- Table: companies
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text generated always as (lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))) stored,
  created_at timestamptz not null default now()
);

-- Table: company_policies
create table if not exists public.company_policies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  company_name text not null,
  title text not null,
  section_index int not null default 1,
  content text not null,
  -- 768-dimension vector embedding (e.g. Gemini text-embedding-004)
  embedding vector(768),
  created_at timestamptz not null default now()
);

-- Fast lookup by company name
create index if not exists idx_company_policies_company_name
  on public.company_policies (company_name);

-- Fast vector similarity search index using IVFFlat (or HNSW)
create index if not exists idx_company_policies_embedding
  on public.company_policies using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- View: company_policy_counts
-- Directly matches the response shape of GET /hr/companies: { companies: [{ name, policy_count }] }
create or replace view public.company_policy_counts as
select
  c.name,
  count(p.id)::int as policy_count
from public.companies c
left join public.company_policies p on p.company_id = c.id
group by c.id, c.name
order by c.name asc;

