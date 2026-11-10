# Supabase SQL Queries for n8n Nodes

Use these ready-to-paste queries inside your n8n **Postgres** (or **Supabase**) nodes.

---

## 1. GET /hr/companies (List Companies & Policy Counts)
```sql
select
  name,
  policy_count
from public.company_policy_counts;
```
*n8n Output Formatter:* Wrap rows in `{ "companies": $input.all().map(i => i.json) }`.

---

## 2. POST /hr/policies/add (Save Policy Chunk)
```sql
-- Step A: Ensure company exists and retrieve company_id
insert into public.companies (name)
values ($1)
on conflict (name) do update set name = excluded.name
returning id, name;

-- Step B: Insert policy chunk
insert into public.company_policies (
  company_id,
  company_name,
  title,
  section_index,
  content,
  embedding
)
values (
  $1, -- company_id
  $2, -- company_name
  $3, -- title
  $4, -- section_index
  $5, -- content
  $6  -- vector embedding (optional)
)
returning id;
```

---

## 3. POST /hr/chat (Vector or Text Policy Search)

### Vector Similarity Search (using `pgvector`):
```sql
select
  title,
  content,
  1 - (embedding <=> $1::vector) as similarity
from public.company_policies
where company_name = $2
order by embedding <=> $1::vector
limit 4;
```

### Fallback Text Search:
```sql
select
  title,
  content
from public.company_policies
where company_name = $1
  and (
    title ilike '%' || $2 || '%'
    or content ilike '%' || $2 || '%'
  )
limit 4;
```

---

## 4. GET /hr/roles (Fetch Open Positions)
```sql
select
  id,
  title,
  department,
  location,
  type,
  summary,
  requirements
from public.roles
where is_open = true
order by created_at asc;
```
*n8n Output Formatter:* Wrap rows in `{ "roles": $input.all().map(i => i.json) }`.

---

## 5. POST /hr/apply (Save Screened Candidate)
```sql
insert into public.candidates (
  name,
  email,
  linkedin,
  role_id,
  role,
  score,
  status,
  fit_label,
  summary,
  strengths,
  gaps,
  red_flags,
  interview_questions,
  recommendation,
  auto_email,
  cv_storage_path
)
values (
  $1,  -- name
  $2,  -- email
  $3,  -- linkedin
  $4,  -- role_id
  $5,  -- role
  $6,  -- score (number)
  $7::public.candidate_status, -- status ('review' | 'shortlisted' | 'rejected')
  $8,  -- fit_label
  $9,  -- summary
  $10::jsonb, -- strengths string[]
  $11::jsonb, -- gaps string[]
  $12::jsonb, -- red_flags string[]
  $13::jsonb, -- interview_questions [{ question, probes }]
  $14, -- recommendation
  $15, -- auto_email notice
  $16  -- cv_storage_path (optional)
)
returning candidate_id, status;
```

---

## 6. GET /hr/candidates (Fetch Pipeline & Stats for Recruiter Dashboard)

### Query 1: Pipeline Stats
```sql
select * from public.candidate_pipeline_stats;
```

### Query 2: Candidate Records
```sql
select
  candidate_id,
  submitted_at,
  name,
  email,
  linkedin,
  role,
  score,
  status,
  fit_label,
  summary,
  strengths,
  gaps,
  red_flags,
  interview_questions,
  recommendation,
  auto_email,
  updated_at,
  interview_at
from public.candidates
order by submitted_at desc;
```
*n8n Output Formatter:* Combine into:
```json
{
  "stats": $json.stats,
  "candidates": $json.candidates
}
```

---

## 7. POST /hr/action (Recruiter Invite or Reject)

### For `invite_interview`:
```sql
-- Step A: Update candidate record
update public.candidates
set
  status = 'interview_invited',
  interview_at = $2,
  interview_mode = $3,
  interview_location = $4,
  interview_note = $5,
  updated_at = now()
where candidate_id = $1
returning candidate_id, status, interview_at;

-- Step B: Insert into audit log
insert into public.hr_actions_audit (
  candidate_id,
  action,
  interview_at,
  mode,
  location,
  note
)
values ($1, 'invite_interview', $2, $3, $4, $5);
```

### For `reject`:
```sql
-- Step A: Update candidate record
update public.candidates
set
  status = 'rejected_by_hr',
  updated_at = now()
where candidate_id = $1
returning candidate_id, status;

-- Step B: Insert into audit log
insert into public.hr_actions_audit (
  candidate_id,
  action
)
values ($1, 'reject');
```

