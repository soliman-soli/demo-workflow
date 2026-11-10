import {
  type ChatResponse,
  type CompaniesResponse,
  type PoliciesResponse,
  type CoachResponse,
  type RolesResponse,
  type ApplyResponse,
  type CandidatesResponse,
  type ActionResponse,
  type HealthResponse,
  type Candidate,
} from "./schemas";

export const MOCK_COMPANIES: CompaniesResponse = {
  companies: [
    { name: "Demo Co", policy_count: 12 },
    { name: "TechStart Inc", policy_count: 5 },
    { name: "Apex Logistics", policy_count: 8 },
  ],
};

export const MOCK_CHAT_RESPONSE: ChatResponse = {
  answer:
    "Demo Co offers 24 working days of paid annual leave per calendar year, accrued monthly at 2 days per month. Unused leave can be rolled over up to a maximum of 5 days into the following year, but must be utilized before March 31st. In addition, team members receive all official public holidays and 5 days of personal emergency leave.",
  sources: ["Annual Leave & Time Off Policy 2026", "Employee Handbook v3.2"],
  found: true,
  follow_ups: [
    "Can I cash out unused annual leave?",
    "How do I submit a leave request in BambooHR?",
    "What is the policy for parental leave?",
  ],
};

export const MOCK_CHAT_NOT_FOUND: ChatResponse = {
  answer:
    "I searched through the uploaded company policies for Demo Co, but could not find specific rules regarding that query. Please reach out to your HR People Partner at hr@democo.com or check with your team lead.",
  sources: [],
  found: false,
  follow_ups: [
    "How many annual leave days do I get?",
    "Can I work remotely?",
    "How do I claim expenses?",
  ],
};

export function getMockChatResponse(query: string): ChatResponse {
  const lower = query.toLowerCase();

  if (/(stock|equity|crypto|bitcoin|pet|dog|cat)/.test(lower)) {
    return MOCK_CHAT_NOT_FOUND;
  }

  if (/(remote|wfh|home|hybrid|office|telecommute|location)/.test(lower)) {
    return {
      answer:
        "Demo Co operates on a flexible hybrid policy. Team members are expected to collaborate from their local office 2 days per week (typically Tuesdays and Thursdays) and may work from home up to 3 days per week. Fully remote arrangements are available upon request with approval from your department lead after completing the 90-day probationary period.",
      sources: ["Hybrid & Remote Work Policy 2026", "Employee Handbook v3.2 §4"],
      found: true,
      follow_ups: [
        "Does Demo Co provide a home office equipment budget?",
        "Can I work from another country temporarily?",
        "What are core collaboration hours for remote work?",
      ],
    };
  }

  if (/(expense|claim|reimburse|receipt|travel|stipend|food|meal|per diem)/.test(lower)) {
    return {
      answer:
        "All business-related expenses must be submitted via Expensify within 30 days of purchase with itemized receipts attached. Team members are eligible for a $50/month home-office internet stipend, and up to $75/person for approved client hospitality lunches. Approved claims are reimbursed directly with the subsequent monthly payroll cycle.",
      sources: ["Expense & Travel Reimbursement Policy v2", "Finance Guidelines 2026"],
      found: true,
      follow_ups: [
        "How do I set up my Expensify account?",
        "What is the daily meal cap during company travel?",
        "Who needs to approve expenses above $500?",
      ],
    };
  }

  if (/(hour|hours|schedule|time|overtime|shift|clock|core)/.test(lower)) {
    return {
      answer:
        "Standard working hours at Demo Co are 40 hours per week, Monday to Friday. We support flexible scheduling around core collaboration hours between 10:00 AM and 4:00 PM local time. You can choose to start anywhere between 8:00 AM and 10:00 AM as long as team deliverables and standup meetings are attended.",
      sources: ["Working Hours & Flexible Scheduling Policy", "Code of Conduct"],
      found: true,
      follow_ups: [
        "How is overtime compensated for eligible team members?",
        "Can I work a 4-day condensed work week?",
        "How do I log hours if I am on an hourly contract?",
      ],
    };
  }

  if (/(probation|trial|new hire|onboard|first 90)/.test(lower)) {
    return {
      answer:
        "The standard probationary period for all newly joined team members is 90 calendar days. A mid-point review is scheduled with your manager at day 45 to share feedback and address any hurdles. A formal confirmation check occurs at day 80, after which permanent employment status and benefits are confirmed.",
      sources: ["Probation & Onboarding Policy", "HR Operational Manual 2026"],
      found: true,
      follow_ups: [
        "Can I use paid annual leave during probation?",
        "When does private health insurance coverage activate?",
        "What happens if probation needs to be extended?",
      ],
    };
  }

  if (/(leave|holiday|vacation|pto|off|sick|maternity|paternity)/.test(lower)) {
    return MOCK_CHAT_RESPONSE;
  }

  return {
    answer:
      `Demo Co maintains clear guidelines for our team. Regarding "${query.slice(0, 50)}", team members should refer to the general employee handbook or coordinate directly with their line manager. Full policy documents are accessible on the internal company drive.`,
    sources: ["Employee Handbook v3.2", "Company Culture & Values Guide"],
    found: true,
    follow_ups: [
      "How many annual leave days do I get?",
      "Can I work remotely?",
      "How do I claim expenses?",
    ],
  };
}

export const MOCK_ROLES: RolesResponse = {
  roles: [
    {
      id: "role-swe-cairo",
      title: "Full-Stack Software Engineer",
      department: "Engineering",
      location: "Cairo, Egypt (Hybrid)",
      type: "Full-time",
      summary:
        "Join our core product team building high-throughput workflow engines, Next.js web applications, and LLM-assisted tools.",
      requirements: [
        "3+ years experience with TypeScript, Next.js, and Node.js",
        "Proficiency with relational databases (PostgreSQL) and schema design",
        "Familiarity with workflow automation tools (n8n, Temporal) or queue systems",
        "Experience building or consuming REST/GraphQL APIs and AI SDKs",
        "Strong written and verbal English communication",
      ],
    },
    {
      id: "role-designer-remote",
      title: "Senior Product Designer",
      department: "Product Design",
      location: "Remote (EMEA timezones)",
      type: "Full-time",
      summary:
        "Lead the end-to-end UX/UI for our candidate assessment suite, analytics dashboards, and interactive self-service portals.",
      requirements: [
        "4+ years of product design experience for B2B SaaS applications",
        "Proven expertise in Figma, design systems, and rapid interactive prototyping",
        "Deep understanding of accessibility (WCAG AA) and responsive web behavior",
        "Ability to translate complex workflows into calm, intuitive UI architectures",
        "Strong portfolio featuring shipped desktop and mobile experiences",
      ],
    },
    {
      id: "role-data-cairo",
      title: "Data Analyst & Automation Specialist",
      department: "Operations",
      location: "Cairo, Egypt (On-site / Hybrid)",
      type: "Full-time",
      summary:
        "Help us build automated reporting pipelines, audit screening data quality, and optimize internal operations across departments.",
      requirements: [
        "Strong background in SQL, Python data analysis (Pandas), and spreadsheet modeling",
        "Experience building dashboards in Metabase, PowerBI, or Tableau",
        "Hands-on experience automating business workflows using n8n or Python scripts",
        "Sharp attention to detail and ability to spot anomalies in candidate pipelines",
      ],
    },
  ],
};

export const MOCK_COACH_REPORT: CoachResponse = {
  ok: true,
  email_notice: "Your full cover letter and customized interview prep guide have been sent to your email.",
  report: {
    match_score: 72,
    verdict: "Strong technical foundation with high potential; address deployment and system scale gaps.",
    summary:
      "Your background demonstrates solid hands-on experience in TypeScript, React, and backend API integration. You have relevant experience building with modern component libraries and state management. To reach a top-tier fit for this role, emphasize your familiarity with workflow orchestration engines and provide concrete metrics on production reliability.",
    strengths: [
      {
        title: "Modern Full-Stack Proficiency",
        evidence:
          "Demonstrated through shipped projects using Next.js App Router, Tailwind CSS, TypeScript, and server-side route handlers.",
      },
      {
        title: "AI & Workflow Automation Mindset",
        evidence:
          "Practical project work integrating LLM webhooks, structured output validation via Zod, and n8n workflow triggers.",
      },
      {
        title: "API Design & Schema Rigor",
        evidence:
          "Clear separation of client/server responsibilities and strong input validation pipelines preventing untrusted data leaks.",
      },
    ],
    gaps: [
      {
        title: "Large-Scale Production Operations",
        why_it_matters:
          "The role involves high-volume concurrent webhook executions where rate limits and connection pooling matter.",
        how_to_fix:
          "Mention experience with Redis queuing, BullMQ, or database connection management under heavy loads.",
      },
      {
        title: "Testing & CI/CD Evidence",
        why_it_matters:
          "Enterprise teams expect automated unit and integration tests before deploying workflow automations.",
        how_to_fix:
          "Highlight your experience with Vitest, Playwright smoke tests, or GitHub Actions deployment pipelines.",
      },
      {
        title: "System Performance Metrics",
        why_it_matters:
          "Recruiters look for measurable business or performance impact rather than just tech stacks.",
        how_to_fix:
          "Quantify past project achievements (e.g., 'Reduced screening latency by 45%', 'Handled 500+ daily webhooks').",
      },
    ],
    focus_next: [
      "Add a dedicated testing section to your CV showcasing Vitest and Playwright test suites.",
      "Incorporate measurable performance metrics into your top two featured project bullets.",
      "Review n8n self-hosting architecture, execution queue modes, and worker concurrency before technical rounds.",
      "Prepare a 2-minute architectural walkthrough of your latest full-stack project.",
    ],
    interview_questions: [
      {
        question:
          "How would you ensure an external webhook service like n8n handles burst traffic without dropping candidate submissions?",
        type: "System Architecture",
        why_asked:
          "Assesses your understanding of async queue decoupling, idempotency keys, and graceful retry strategies.",
      },
      {
        question:
          "Can you walk us through how you prevent sensitive API keys or candidate PII from leaking to the browser in a Next.js application?",
        type: "Security & API Design",
        why_asked:
          "Verifies that you understand server-side proxy patterns and never expose environment variables or raw upstream payloads.",
      },
      {
        question:
          "Describe a situation where an AI model generated a hallucinated or non-compliant output. How did your code catch and handle it?",
        type: "AI Reliability",
        why_asked:
          "Tests your practical experience with Zod schema verification and fallback UI states when AI models misbehave.",
      },
      {
        question:
          "How do you approach writing end-to-end tests for a workflow that involves asynchronous background processing?",
        type: "Testing & QA",
        why_asked:
          "Shows whether you can mock external webhook responses or construct deterministic integration fixtures.",
      },
      {
        question:
          "Tell us about a time you had to learn a new tool or framework under a tight project deadline. How did you structure your learning?",
        type: "Behavioral & Learning Agility",
        why_asked:
          "Evaluates self-sufficiency, engineering curiosity, and ability to ship functional solutions quickly.",
      },
    ],
  },
};

export const MOCK_CANDIDATES: Candidate[] = [
  {
    candidate_id: "cand-001",
    submitted_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 min ago
    name: "Tarek Mostafa",
    email: "tarek.mostafa@example.com",
    linkedin: "https://linkedin.com/in/tarekmostafa-dev",
    role: "Full-Stack Software Engineer",
    score: 88,
    status: "shortlisted",
    fit_label: "Exceptional Match",
    summary:
      "Tarek has 4 years of engineering experience with TypeScript, Next.js, and automated backend workers. Built complex event-driven pipelines and demonstrated strong testing discipline.",
    strengths: [
      "Extensive experience with Next.js App Router and server actions",
      "Demonstrated ownership of production Redis and PostgreSQL workloads",
      "Clean architectural approach with strong type safety",
    ],
    gaps: [
      "Limited direct exposure to n8n node development (uses standard REST nodes)",
    ],
    red_flags: [],
    interview_questions: [
      {
        question: "How do you handle schema migrations in high-availability environments?",
        probes: "Look for zero-downtime migration steps, feature flags, and backward compatibility.",
      },
      {
        question: "Explain your strategy for rate-limiting distributed API endpoints.",
        probes: "Probe for sliding window algorithms, Redis token buckets, and edge proxies.",
      },
    ],
    recommendation: "Strongly recommend immediate first-round technical interview.",
    auto_email: "Auto-shortlisted email sent (Score 88 > 85 threshold).",
    updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    interview_at: null,
  },
  {
    candidate_id: "cand-002",
    submitted_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    name: "Nour El-Din",
    email: "nour.eldin@example.com",
    linkedin: "https://linkedin.com/in/nour-eldin-ux",
    role: "Senior Product Designer",
    score: 74,
    status: "review",
    fit_label: "Solid Candidate",
    summary:
      "Solid B2B design experience with great portfolio case studies. Strong understanding of typography, spacing, and design systems. Needs evaluation on design tokens and accessibility edge cases.",
    strengths: [
      "High visual craft and thoughtful typography hierarchy",
      "Demonstrated empathy for recruiter operational friction",
      "Strong prototyping skills in Figma",
    ],
    gaps: [
      "Could demonstrate deeper knowledge of WCAG AA high-contrast rules",
      "Less experience designing mobile data tables",
    ],
    red_flags: [],
    interview_questions: [
      {
        question: "Walk us through a design decision where business goals conflicted with user needs.",
        probes: "Check for pragmatic balance, stakeholder communication, and iterative validation.",
      },
      {
        question: "How do you hand off complex responsive data tables to frontend engineers?",
        probes: "Check for edge states (overflow, long strings, empty states, keyboard nav).",
      },
    ],
    recommendation: "Review portfolio case studies and schedule hiring manager chat.",
    auto_email: "Application acknowledgment email sent. Marked for recruiter review.",
    updated_at: new Date(Date.now() - 1000 * 60 * 115).toISOString(),
    interview_at: null,
  },
  {
    candidate_id: "cand-003",
    submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    name: "Sarah Jenkins",
    email: "sarah.j@example.com",
    linkedin: "https://linkedin.com/in/sarah-jenkins-data",
    role: "Data Analyst & Automation Specialist",
    score: 91,
    status: "interview_invited",
    fit_label: "Outstanding Fit",
    summary:
      "Outstanding match with hands-on experience in n8n automation, Python ETL scripts, and Metabase dashboards. Already invited for a live technical discussion.",
    strengths: [
      "Direct professional experience building n8n workflows for lead routing",
      "Advanced SQL querying and performance tuning",
      "Clear communication and stakeholder reporting abilities",
    ],
    gaps: [
      "Primarily worked on GCP BigQuery rather than PostgreSQL, but easily transferable",
    ],
    red_flags: [],
    interview_questions: [
      {
        question: "Can you describe the most complex n8n workflow you built and how you monitored errors?",
        probes: "Look for error triggers, Slack alert channels, and data dead-lettering.",
      },
    ],
    recommendation: "Candidate already invited. Prepare data architecture probe questions.",
    auto_email: "Interview invitation sent via recruiter dashboard.",
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    interview_at: "Sun 9 Nov 2026, 11:00 (Cairo time)",
  },
  {
    candidate_id: "cand-004",
    submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
    name: "Karim Adel",
    email: "karim.adel@example.com",
    linkedin: "https://linkedin.com/in/karim-adel-dev",
    role: "Full-Stack Software Engineer",
    score: 38,
    status: "rejected",
    fit_label: "Under-qualified",
    summary:
      "Applicant CV indicates early junior background with basic HTML/CSS and introductory Python. Missing core requirements for Next.js, TypeScript, and database architecture.",
    strengths: ["Shows enthusiasm for learning modern web development"],
    gaps: [
      "No TypeScript or Next.js experience listed",
      "Lacks relational database experience",
      "Under minimum required experience threshold (3 years)",
    ],
    red_flags: ["Major skill mismatch with position requirements"],
    interview_questions: [], // Per spec: No interview questions generated for auto-rejected candidates
    recommendation: "Auto-rejected based on score below 50. Still retained for audit.",
    auto_email: "Automated polite rejection email sent.",
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    interview_at: null,
  },
  {
    candidate_id: "cand-005",
    submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    name: "Mona Zakaria",
    email: "mona.zakaria@example.com",
    linkedin: "https://linkedin.com/in/mona-zakaria-pm",
    role: "Senior Product Designer",
    score: 55,
    status: "rejected_by_hr",
    fit_label: "Marginal Fit",
    summary:
      "Experienced in marketing visual graphics and branding, but lacks required experience in complex SaaS product design and workflow software architecture.",
    strengths: ["Strong branding and presentation visual design"],
    gaps: [
      "No evidence of interaction design or state machine modeling",
      "Little familiarity with web accessibility guidelines",
    ],
    red_flags: [],
    interview_questions: [],
    recommendation: "Candidate was reviewed by hiring manager and rejected with feedback.",
    auto_email: "Manual rejection email sent with encouragement to reapply for marketing roles.",
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    interview_at: null,
  },
];

export function getMockCandidates(): CandidatesResponse {
  const total = MOCK_CANDIDATES.length;
  const review = MOCK_CANDIDATES.filter((c) => c.status === "review").length;
  const shortlisted = MOCK_CANDIDATES.filter((c) => c.status === "shortlisted").length;
  const rejected = MOCK_CANDIDATES.filter(
    (c) => c.status === "rejected" || c.status === "rejected_by_hr"
  ).length;
  const interview_invited = MOCK_CANDIDATES.filter(
    (c) => c.status === "interview_invited"
  ).length;

  const validScores = MOCK_CANDIDATES.filter((c) => c.score !== null).map(
    (c) => c.score as number
  );
  const avg_score =
    validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 0;

  return {
    stats: {
      total,
      review,
      shortlisted,
      rejected,
      interview_invited,
      avg_score,
    },
    candidates: MOCK_CANDIDATES,
  };
}

export const MOCK_APPLY_SUCCESS: ApplyResponse = {
  ok: true,
  message: "Application received. You'll hear back by email within 48 hours.",
};

export const MOCK_POLICIES_RESPONSE: PoliciesResponse = {
  ok: true,
  added: 6,
  company: "Demo Co",
};

export const MOCK_HEALTH_RESPONSE: HealthResponse = {
  status: "live",
  time: new Date().toISOString(),
};

export function getMockActionResponse(
  candidate_id: string,
  action: "invite_interview" | "reject",
  interview_at?: string
): ActionResponse {
  return {
    ok: true,
    candidate_id,
    status: action === "invite_interview" ? "interview_invited" : "rejected_by_hr",
    interview_at: action === "invite_interview" ? interview_at : undefined,
  };
}

export const SHOWCASE_CANDIDATES: Candidate[] = [
  {
    ...MOCK_CANDIDATES[0],
    candidate_id: "demo-001",
    role: "Backend Engineer",
  },
  {
    ...MOCK_CANDIDATES[1],
    candidate_id: "demo-002",
    role: "Frontend Engineer",
  },
  {
    ...MOCK_CANDIDATES[2],
    candidate_id: "demo-003",
    role: "AI Automation Engineer",
    score: 92,
  },
  {
    ...MOCK_CANDIDATES[3],
    candidate_id: "demo-004",
    role: "Backend Engineer",
  },
];

// ---------------------------------------------------------------------------
// Mutable mock state (per server process) so the demo feels real in mock mode.
// ---------------------------------------------------------------------------

const globalForMocks = globalThis as unknown as {
  __hrMock?: {
    companies: CompaniesResponse["companies"];
    candidates: Candidate[];
    showcase: Candidate[];
  };
};

function state() {
  if (!globalForMocks.__hrMock) {
    globalForMocks.__hrMock = {
      companies: MOCK_COMPANIES.companies.map((c) => ({ ...c })),
      candidates: MOCK_CANDIDATES.map((c) => ({ ...c })),
      showcase: SHOWCASE_CANDIDATES.map((c) => ({ ...c })),
    };
  }
  if (!globalForMocks.__hrMock.showcase) {
    globalForMocks.__hrMock.showcase = SHOWCASE_CANDIDATES.map((c) => ({ ...c }));
  }
  return globalForMocks.__hrMock;
}

export function isShowcaseCandidateId(candidateId: string): boolean {
  return candidateId.startsWith("demo-");
}

function summarizeCandidates(candidates: Candidate[]): CandidatesResponse {
  const scores = candidates.map((c) => c.score).filter((s): s is number => s !== null);
  return {
    stats: {
      total: candidates.length,
      review: candidates.filter((c) => c.status === "review").length,
      shortlisted: candidates.filter((c) => c.status === "shortlisted").length,
      rejected: candidates.filter((c) => c.status === "rejected" || c.status === "rejected_by_hr").length,
      interview_invited: candidates.filter((c) => c.status === "interview_invited").length,
      avg_score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    },
    candidates: [...candidates],
  };
}

export function mergeWithShowcaseCandidates(live: CandidatesResponse): CandidatesResponse {
  const existingIds = new Set(live.candidates.map((c) => c.candidate_id));
  const demoRows = state().showcase.filter((c) => !existingIds.has(c.candidate_id));
  return summarizeCandidates([...live.candidates, ...demoRows]);
}

export function mockListCompanies(): CompaniesResponse {
  return { companies: state().companies };
}

export function mockAddPolicies(company: string, added: number): PoliciesResponse {
  const s = state();
  const existing = s.companies.find((c) => c.name.toLowerCase() === company.toLowerCase());
  if (existing) existing.policy_count += added;
  else s.companies.push({ name: company, policy_count: added });
  return { ok: true, added, company: existing?.name ?? company };
}

export function mockListCandidates(): CandidatesResponse {
  return summarizeCandidates(state().candidates);
}

export function mockApplyAction(
  candidate_id: string,
  action: "invite_interview" | "reject",
  interview_at?: string
): ActionResponse | null {
  const s = state();
  const c =
    s.candidates.find((x) => x.candidate_id === candidate_id) ??
    s.showcase.find((x) => x.candidate_id === candidate_id);
  if (!c) return null;
  c.status = action === "invite_interview" ? "interview_invited" : "rejected_by_hr";
  c.interview_at = action === "invite_interview" ? interview_at ?? null : c.interview_at;
  c.updated_at = new Date().toISOString();
  return getMockActionResponse(candidate_id, action, interview_at);
}

/**
 * Magic inputs that force error states in mock mode (handy for UI testing):
 * - chat message containing "[fail]"   -> 502
 * - coach role containing "[fail]"     -> ok:false
 * - apply name containing "[fail]"     -> 400 with errors[]
 */
export const MOCK_FAIL_TOKEN = "[fail]";

