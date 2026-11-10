import { z } from "zod";

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const ChatRequestSchema = z.object({
  message: z.string().trim().min(1, "Please type a question.").max(1000, "Messages are limited to 1000 characters."),
  company: z.string().trim().min(1).max(120),
  history: z.array(ChatMessageSchema.extend({ content: z.string().max(4000) })).max(6).default([]),
});

export const ChatResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(z.string()),
  found: z.boolean(),
  follow_ups: z.array(z.string()),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// ---------------------------------------------------------------------------
// Companies
// ---------------------------------------------------------------------------

export const CompanySchema = z.object({
  name: z.string(),
  policy_count: z.number(),
});

export const CompaniesResponseSchema = z.object({
  companies: z.array(CompanySchema),
});

export type Company = z.infer<typeof CompanySchema>;
export type CompaniesResponse = z.infer<typeof CompaniesResponseSchema>;

// ---------------------------------------------------------------------------
// Policies
// ---------------------------------------------------------------------------

export const PoliciesResponseSchema = z.object({
  ok: z.boolean(),
  added: z.number(),
  company: z.string(),
});

export type PoliciesResponse = z.infer<typeof PoliciesResponseSchema>;

// ---------------------------------------------------------------------------
// Coach
// ---------------------------------------------------------------------------

export const PolicyFormSchema = z
  .object({
    company: z.string().trim().min(1, "Company name is required.").max(120),
    title: z.string().trim().max(200).optional(),
    text: z.string().trim().max(50_000, "Policy text is limited to 50,000 characters.").optional(),
  });

export const CoachRequestSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z.string().trim().email("Please enter a valid email address."),
  role: z.string().trim().min(1, "Please enter a target role.").max(160),
  job_description: z.string().trim().max(10_000, "Job description is limited to 10,000 characters.").optional(),
});

export const CoachStrengthSchema = z.object({
  title: z.string(),
  evidence: z.string(),
});

export const CoachGapSchema = z.object({
  title: z.string(),
  why_it_matters: z.string(),
  how_to_fix: z.string(),
});

export const CoachQuestionSchema = z.object({
  question: z.string(),
  type: z.string(),
  why_asked: z.string(),
});

export const CoachReportSchema = z.object({
  match_score: z.number(),
  verdict: z.string(),
  summary: z.string(),
  strengths: z.array(CoachStrengthSchema),
  gaps: z.array(CoachGapSchema),
  focus_next: z.array(z.string()),
  interview_questions: z.array(CoachQuestionSchema),
});

export const CoachSuccessResponseSchema = z.object({
  ok: z.literal(true),
  report: CoachReportSchema,
  email_notice: z.string(),
});

export const CoachErrorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
});

export const CoachResponseSchema = z.union([
  CoachSuccessResponseSchema,
  CoachErrorResponseSchema,
]);

export type CoachStrength = z.infer<typeof CoachStrengthSchema>;
export type CoachGap = z.infer<typeof CoachGapSchema>;
export type CoachQuestion = z.infer<typeof CoachQuestionSchema>;
export type CoachReport = z.infer<typeof CoachReportSchema>;
export type CoachResponse = z.infer<typeof CoachResponseSchema>;

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export const RoleSchema = z.object({
  id: z.string(),
  title: z.string(),
  department: z.string(),
  location: z.string(),
  type: z.string(),
  summary: z.string(),
  requirements: z.array(z.string()),
});

export const RolesResponseSchema = z.object({
  roles: z.array(RoleSchema),
});

export type Role = z.infer<typeof RoleSchema>;
export type RolesResponse = z.infer<typeof RolesResponseSchema>;

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

export function isLinkedInUrl(value: string): boolean {
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.hostname === "linkedin.com" || url.hostname.endsWith(".linkedin.com");
  } catch {
    return false;
  }
}

export const ApplyRequestSchema = z.object({
  name: z.string().trim().min(1, "Please enter your full name.").max(120),
  email: z.string().trim().email("Please enter a valid email address."),
  linkedin: z
    .string()
    .trim()
    .min(1, "Please add your LinkedIn profile URL.")
    .refine(isLinkedInUrl, { message: "LinkedIn URL must be a linkedin.com link." }),
  role_id: z.string().trim().min(1, "Please choose a role."),
});

export const ApplySuccessResponseSchema = z.object({
  ok: z.literal(true),
  message: z.string(),
});

export const ApplyErrorResponseSchema = z.object({
  ok: z.literal(false),
  errors: z.array(z.string()),
});

export const ApplyResponseSchema = z.union([
  ApplySuccessResponseSchema,
  ApplyErrorResponseSchema,
]);

export type ApplyRequest = z.infer<typeof ApplyRequestSchema>;
export type ApplySuccessResponse = z.infer<typeof ApplySuccessResponseSchema>;
export type ApplyErrorResponse = z.infer<typeof ApplyErrorResponseSchema>;
export type ApplyResponse = z.infer<typeof ApplyResponseSchema>;

// ---------------------------------------------------------------------------
// Candidates
// ---------------------------------------------------------------------------

export const CandidateStatusSchema = z.enum([
  "review",
  "shortlisted",
  "rejected",
  "rejected_by_hr",
  "interview_invited",
]);

export const CandidateQuestionSchema = z.object({
  question: z.string(),
  probes: z.string(),
});

export const CandidateSchema = z.object({
  candidate_id: z.string(),
  submitted_at: z.string(),
  name: z.string(),
  email: z.string(),
  linkedin: z.string(),
  role: z.string(),
  score: z.number().nullable(),
  status: CandidateStatusSchema,
  fit_label: z.string(),
  summary: z.string(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  red_flags: z.array(z.string()),
  interview_questions: z.array(CandidateQuestionSchema),
  recommendation: z.string(),
  auto_email: z.string(),
  updated_at: z.string(),
  interview_at: z.string().nullable(),
});

export const CandidateStatsSchema = z.object({
  total: z.number(),
  review: z.number(),
  shortlisted: z.number(),
  rejected: z.number(),
  interview_invited: z.number(),
  avg_score: z.number().nullable().transform((v) => v ?? 0),
});

export const CandidatesResponseSchema = z.object({
  stats: CandidateStatsSchema,
  candidates: z.array(CandidateSchema),
});

export type CandidateStatus = z.infer<typeof CandidateStatusSchema>;
export type CandidateQuestion = z.infer<typeof CandidateQuestionSchema>;
export type Candidate = z.infer<typeof CandidateSchema>;
export type CandidateStats = z.infer<typeof CandidateStatsSchema>;
export type CandidatesResponse = z.infer<typeof CandidatesResponseSchema>;

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

export const ActionRequestSchema = z.object({
  candidate_id: z.string().min(1),
  action: z.enum(["invite_interview", "reject"]),
  interview_at: z.string().optional(),
  mode: z.enum(["online", "onsite"]).optional(),
  location: z.string().optional(),
  note: z.string().optional(),
});

export const ActionResponseSchema = z.object({
  ok: z.boolean(),
  candidate_id: z.string(),
  status: z.string(),
  interview_at: z.string().optional(),
});

export type ActionRequest = z.infer<typeof ActionRequestSchema>;
export type ActionResponse = z.infer<typeof ActionResponseSchema>;

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export const HealthResponseSchema = z.object({
  status: z.literal("live"),
  time: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

// ---------------------------------------------------------------------------
// HR Login
// ---------------------------------------------------------------------------

export const LoginRequestSchema = z.object({
  passcode: z.string().min(1, "Passcode is required.").max(200),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
