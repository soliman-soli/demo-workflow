-- ============================================================================
-- 07: SEED DATA
-- Default companies, policy sections, roles, and initial candidate data
-- ============================================================================

-- Seed Companies
insert into public.companies (name)
values
  ('Demo Co'),
  ('TechStart Inc'),
  ('Apex Logistics')
on conflict (name) do nothing;

-- Seed Sample Policies for Demo Co
insert into public.company_policies (company_id, company_name, title, section_index, content)
select
  c.id,
  c.name,
  'Annual Leave & Time Off Policy 2026',
  1,
  'Demo Co offers 24 working days of paid annual leave per calendar year, accrued monthly at 2 days per month. Unused leave can be rolled over up to a maximum of 5 days into the following year, but must be utilized before March 31st.'
from public.companies c where c.name = 'Demo Co'
on conflict do nothing;

insert into public.company_policies (company_id, company_name, title, section_index, content)
select
  c.id,
  c.name,
  'Remote & Hybrid Work Policy',
  1,
  'Employees in technical and product roles are eligible for a hybrid schedule (up to 3 remote days per week) following completion of their 3-month probation period. Core working hours are 10:00 AM to 4:00 PM Cairo time.'
from public.companies c where c.name = 'Demo Co'
on conflict do nothing;

-- Seed Open Roles
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

-- Seed Sample Candidates for the Recruiter Dashboard
insert into public.candidates (
  candidate_id,
  submitted_at,
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
  interview_at
)
values
  (
    'cand-001',
    now() - interval '35 minutes',
    'Tarek Mostafa',
    'tarek.mostafa@example.com',
    'https://linkedin.com/in/tarekmostafa-dev',
    'role-swe-cairo',
    'Full-Stack Software Engineer',
    88,
    'shortlisted',
    'Exceptional Match',
    'Tarek has 4 years of engineering experience with TypeScript, Next.js, and automated backend workers.',
    '["Extensive experience with Next.js App Router", "Demonstrated ownership of production Redis & PostgreSQL", "Clean architectural approach"]'::jsonb,
    '["Limited direct exposure to custom n8n node development"]'::jsonb,
    '[]'::jsonb,
    '[{"question": "How do you handle schema migrations in high-availability environments?", "probes": "Look for zero-downtime migration patterns and backward compatibility."}]'::jsonb,
    'Strongly recommend immediate first-round technical interview.',
    'Auto-shortlisted email sent (Score 88 > 85 threshold).',
    null
  ),
  (
    'cand-002',
    now() - interval '2 hours',
    'Nour El-Din',
    'nour.eldin@example.com',
    'https://linkedin.com/in/nour-eldin-ux',
    'role-designer-remote',
    'Senior Product Designer',
    74,
    'review',
    'Solid Candidate',
    'Solid B2B design experience with great portfolio case studies. Needs evaluation on design tokens.',
    '["High visual craft and thoughtful typography hierarchy", "Demonstrated empathy for recruiter operational friction"]'::jsonb,
    '["Could demonstrate deeper knowledge of WCAG AA high-contrast rules"]'::jsonb,
    '[]'::jsonb,
    '[{"question": "Walk us through a design decision where business goals conflicted with user needs.", "probes": "Check for pragmatic balance and stakeholder communication."}]'::jsonb,
    'Review portfolio case studies and schedule hiring manager chat.',
    'Application acknowledgment email sent. Marked for recruiter review.',
    null
  ),
  (
    'cand-003',
    now() - interval '5 hours',
    'Sarah Jenkins',
    'sarah.j@example.com',
    'https://linkedin.com/in/sarah-jenkins-data',
    'role-data-cairo',
    'Data Analyst & Automation Specialist',
    91,
    'interview_invited',
    'Outstanding Fit',
    'Outstanding match with hands-on experience in n8n automation, Python ETL scripts, and dashboards.',
    '["Direct professional experience building n8n workflows", "Advanced SQL querying and performance tuning"]'::jsonb,
    '["Primarily worked on GCP BigQuery rather than PostgreSQL"]'::jsonb,
    '[]'::jsonb,
    '[{"question": "Describe the most complex n8n workflow you built and how you monitored errors.", "probes": "Look for error triggers and Slack alerts."}]'::jsonb,
    'Candidate already invited. Prepare data architecture probe questions.',
    'Interview invitation sent via recruiter dashboard.',
    'Sun 9 Nov 2026, 11:00 (Cairo time)'
  ),
  (
    'cand-004',
    now() - interval '8 hours',
    'Karim Adel',
    'karim.adel@example.com',
    'https://linkedin.com/in/karim-adel-dev',
    'role-swe-cairo',
    'Full-Stack Software Engineer',
    38,
    'rejected',
    'Under-qualified',
    'Applicant CV indicates early junior background missing Next.js, TypeScript, and relational databases.',
    '["Shows enthusiasm for learning modern web development"]'::jsonb,
    '["No TypeScript or Next.js experience listed", "Lacks relational database experience"]'::jsonb,
    '["Major skill mismatch with position requirements"]'::jsonb,
    '[]'::jsonb,
    'Auto-rejected based on score below 50. Still retained for audit.',
    'Automated polite rejection email sent.',
    null
  )
on conflict (candidate_id) do nothing;
