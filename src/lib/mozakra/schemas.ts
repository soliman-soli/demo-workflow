import { z } from "zod";

export const MOZAKRA_MIN_TEXT_CHARS = 200;
export const MOZAKRA_MAX_TEXT_CHARS = 30_000;
export const MOZAKRA_MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB
export const MOZAKRA_HEX32_REGEX = /^[a-f0-9]{32}$/i;

export const OptionKeySchema = z.enum(["A", "B", "C", "D"]);
export const DaysForwardSchema = z.union([
  z.literal(1),
  z.literal(3),
  z.literal(7),
  z.literal(14),
]);

// ---------------------------------------------------------------------------
// Shared Sub-Schemas
// ---------------------------------------------------------------------------

export const MozakraTermSchema = z.object({
  term: z.string(),
  definition: z.string(),
});

export const MozakraDroppedItemSchema = z.object({
  n: z.number(),
  why: z.string(),
});

export const MozakraLiveQuestionSchema = z.object({
  questionId: z.string().min(1),
  topic: z.string(),
  question: z.string(),
  options: z.object({
    A: z.string(),
    B: z.string(),
    C: z.string(),
    D: z.string(),
  }),
});

export const MozakraLiveQuizSchema = z.object({
  token: z.string().min(1),
  total: z.number().int().min(1),
  questions: z.array(MozakraLiveQuestionSchema),
});

export const MozakraErrorResponseSchema = z.object({
  ok: z.literal(false),
  status: z.number().optional(),
  error: z.string(),
});

// ---------------------------------------------------------------------------
// 1. POST /api/mozakra/start
// ---------------------------------------------------------------------------

export const MozakraStartTextRequestSchema = z.object({
  text: z
    .string()
    .trim()
    .min(
      MOZAKRA_MIN_TEXT_CHARS,
      `Lecture text must be at least ${MOZAKRA_MIN_TEXT_CHARS} characters.`
    )
    .max(
      MOZAKRA_MAX_TEXT_CHARS,
      `Lecture text must be ${MOZAKRA_MAX_TEXT_CHARS.toLocaleString()} characters or fewer.`
    ),
});

export const MozakraStartUpstreamSuccessSchema = z.object({
  ok: z.literal(true),
  status: z.number().optional(),
  sessionId: z.string().optional(),
  lectureId: z.string(),
  simDate: z.string(),
  summary: z.string(),
  terms: z.array(MozakraTermSchema).default([]),
  dropped: z.array(MozakraDroppedItemSchema).default([]),
  validCount: z.number().int().min(0),
  quiz: MozakraLiveQuizSchema,
});

export const MozakraStartUpstreamResponseSchema = z.union([
  MozakraStartUpstreamSuccessSchema,
  MozakraErrorResponseSchema,
]);

export const MozakraStartClientSuccessSchema =
  MozakraStartUpstreamSuccessSchema.omit({ sessionId: true });

export const MozakraStartClientResponseSchema = z.union([
  MozakraStartClientSuccessSchema,
  MozakraErrorResponseSchema,
]);

// ---------------------------------------------------------------------------
// 2. POST /api/mozakra/grade
// ---------------------------------------------------------------------------

export const MozakraGradeRequestSchema = z.object({
  token: z
    .string()
    .regex(MOZAKRA_HEX32_REGEX, "Invalid quiz token."),
  answers: z.record(z.string().min(1), OptionKeySchema),
});

export const MozakraGradeItemResultSchema = z.object({
  questionId: z.string(),
  topic: z.string().optional(),
  question: z.string().optional(),
  chosen: OptionKeySchema.nullable().optional(),
  correct: OptionKeySchema,
  correctText: z.string().optional(),
  isCorrect: z.boolean(),
  explanation: z.string(),
  previousBox: z.number().int().min(1).max(4),
  newBox: z.number().int().min(1).max(4),
  nextReviewDays: z.number().int().min(1),
  nextReviewDate: z.string().optional(),
  nextReviewLabel: z.string(),
});

export const MozakraGradeSuccessSchema = z.object({
  ok: z.literal(true),
  status: z.number().optional(),
  simDate: z.string(),
  score: z.number().int().min(0),
  total: z.number().int().min(1),
  results: z.array(MozakraGradeItemResultSchema),
});

export const MozakraGradeResponseSchema = z.union([
  MozakraGradeSuccessSchema,
  MozakraErrorResponseSchema,
]);

// ---------------------------------------------------------------------------
// 3. POST /api/mozakra/next
// ---------------------------------------------------------------------------

export const MozakraNextRequestSchema = z.object({
  daysForward: DaysForwardSchema,
});

export const MozakraNextQuizSuccessSchema = z.object({
  ok: z.literal(true),
  status: z.number().optional(),
  simDate: z.string(),
  quiz: MozakraLiveQuizSchema,
  resumed: z.boolean().optional(),
  none: z.literal(false).optional(),
});

export const MozakraNextNoneSuccessSchema = z.object({
  ok: z.literal(true),
  status: z.number().optional(),
  simDate: z.string().optional(),
  none: z.literal(true),
  message: z.string(),
});

export const MozakraNextResponseSchema = z.union([
  MozakraNextQuizSuccessSchema,
  MozakraNextNoneSuccessSchema,
  MozakraErrorResponseSchema,
]);

// ---------------------------------------------------------------------------
// 4. POST /api/mozakra/state
// ---------------------------------------------------------------------------

export const MozakraStateCardSchema = z.object({
  questionId: z.string(),
  box: z.number().int().min(1).max(4),
  nextReview: z.string().nullable().optional(),
  lastResult: z.string().nullable().optional(),
  timesSeen: z.number().int().min(0).optional(),
  topic: z.string(),
  question: z.string(),
});

export const MozakraStateQuizRowSchema = z.object({
  date: z.string(),
  status: z.string(),
  score: z.number().nullable().optional(),
  total: z.number().nullable().optional(),
});

export const MozakraStateSuccessSchema = z.object({
  ok: z.literal(true),
  status: z.number().optional(),
  simDate: z.string(),
  boxCounts: z.record(z.string(), z.number()),
  cards: z.array(MozakraStateCardSchema),
  quizzes: z.array(MozakraStateQuizRowSchema).default([]),
});

export const MozakraStateResponseSchema = z.union([
  MozakraStateSuccessSchema,
  MozakraErrorResponseSchema,
]);

// ---------------------------------------------------------------------------
// 5. GET /api/mozakra/overview
// ---------------------------------------------------------------------------

export const MozakraTopicStatSchema = z.object({
  topic: z.string(),
  percentCorrect: z.number(),
  answers: z.number(),
});

export const MozakraQuestionStatSchema = z.object({
  question: z.string(),
  percentCorrect: z.number(),
  answers: z.number(),
});

export const MozakraOverviewSuccessSchema = z.object({
  ok: z.literal(true),
  status: z.number().optional(),
  updatedAt: z.string(),
  lectures: z.number(),
  questionsInBank: z.number(),
  sessions: z.number(),
  quizzesSent: z.number(),
  quizzesCompleted: z.number(),
  completionRate: z.number(),
  averageScore: z.number(),
  boxDistribution: z.record(z.string(), z.number()),
  weakestTopics: z.array(MozakraTopicStatSchema).default([]),
  hardestQuestions: z.array(MozakraQuestionStatSchema).default([]),
  errorsLast7Days: z.number(),
});

export const MozakraOverviewResponseSchema = z.union([
  MozakraOverviewSuccessSchema,
  MozakraErrorResponseSchema,
]);

// ---------------------------------------------------------------------------
// Shared Inferred Types
// ---------------------------------------------------------------------------

export type OptionKey = z.infer<typeof OptionKeySchema>;
export type DaysForward = z.infer<typeof DaysForwardSchema>;
export type MozakraTerm = z.infer<typeof MozakraTermSchema>;
export type MozakraDroppedItem = z.infer<typeof MozakraDroppedItemSchema>;
export type MozakraLiveQuestion = z.infer<typeof MozakraLiveQuestionSchema>;
export type MozakraLiveQuiz = z.infer<typeof MozakraLiveQuizSchema>;
export type MozakraErrorResponse = z.infer<typeof MozakraErrorResponseSchema>;
export type MozakraStartClientSuccess = z.infer<
  typeof MozakraStartClientSuccessSchema
>;
export type MozakraStartClientResponse = z.infer<
  typeof MozakraStartClientResponseSchema
>;
export type MozakraGradeRequest = z.infer<typeof MozakraGradeRequestSchema>;
export type MozakraGradeItemResult = z.infer<
  typeof MozakraGradeItemResultSchema
>;
export type MozakraGradeSuccess = z.infer<typeof MozakraGradeSuccessSchema>;
export type MozakraGradeResponse = z.infer<typeof MozakraGradeResponseSchema>;
export type MozakraNextRequest = z.infer<typeof MozakraNextRequestSchema>;
export type MozakraNextResponse = z.infer<typeof MozakraNextResponseSchema>;
export type MozakraStateCard = z.infer<typeof MozakraStateCardSchema>;
export type MozakraStateQuizRow = z.infer<typeof MozakraStateQuizRowSchema>;
export type MozakraStateSuccess = z.infer<typeof MozakraStateSuccessSchema>;
export type MozakraStateResponse = z.infer<typeof MozakraStateResponseSchema>;
export type MozakraOverviewSuccess = z.infer<
  typeof MozakraOverviewSuccessSchema
>;
export type MozakraOverviewResponse = z.infer<
  typeof MozakraOverviewResponseSchema
>;

