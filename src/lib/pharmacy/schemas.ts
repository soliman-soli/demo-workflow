import { z } from "zod";

// ---------------------------------------------------------------------------
// Google Sheet Tables
// ---------------------------------------------------------------------------

export const CatalogItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  strength: z.string(),
  price_egp: z.number(),
  stock: z.number().int().min(0),
  requires_rx: z.boolean(),
  alternative_id: z.string().nullable(),
});

export const ReservationStatusSchema = z.enum([
  "pending",
  "reserved",
  "rejected",
  "expired",
]);

export const ReservationLineSchema = z.object({
  request_id: z.string(),
  line_no: z.number().int().min(1),
  customer: z.string(),
  medicine_id: z.string(),
  qty: z.number().int().min(1),
  status: ReservationStatusSchema,
  created_at: z.string(),
  expires_at: z.string(),
});

export const ErrorLogEntrySchema = z.object({
  timestamp: z.string(),
  workflow: z.string(),
  message: z.string(),
});

// ---------------------------------------------------------------------------
// Execution Log
// ---------------------------------------------------------------------------

export const ExecutionStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  detail: z.string(),
  status: z.enum(["ok", "warn", "error"]),
  duration_ms: z.number(),
});

export const ExecutionRunSchema = z.object({
  run_id: z.string(),
  workflow: z.enum(["customer-message", "pharmacist-decision", "reset"]),
  status: z.enum(["idle", "running", "succeeded", "failed"]),
  started_at: z.string(),
  steps: z.array(ExecutionStepSchema),
});

// ---------------------------------------------------------------------------
// WhatsApp & Telegram UI Models
// ---------------------------------------------------------------------------

export const PharmacyChatMessageSchema = z.object({
  id: z.string(),
  sender: z.enum(["customer", "bot"]),
  text: z.string(),
  text_ar: z.string().optional(),
  image_name: z.string().nullable().optional(),
  request_id: z.string().nullable().optional(),
  timestamp: z.string(),
});

export const AlternativeInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  strength: z.string(),
  price_egp: z.number(),
});

export const TelegramCardLineSchema = z.object({
  line_no: z.number().int().min(1),
  medicine_id: z.string(),
  medicine_name: z.string(),
  qty: z.number().int().min(1),
  price_egp: z.number(),
  stock: z.number().int().min(0),
  in_stock: z.boolean(),
  requires_rx: z.boolean(),
  alternative: AlternativeInfoSchema.nullable(),
});

export const TelegramCardSchema = z.object({
  id: z.string(),
  request_id: z.string(),
  customer: z.string(),
  is_prescription: z.boolean(),
  source_summary: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
  decided_by: z.string().nullable(),
  decision_note: z.string().nullable(),
  created_at: z.string(),
  decided_at: z.string().nullable(),
  lines: z.array(TelegramCardLineSchema),
});

// ---------------------------------------------------------------------------
// Full Simulator State & Route Payloads
// ---------------------------------------------------------------------------

export const PharmacyStateSchema = z.object({
  mode: z.enum(["mock", "live"]),
  catalog: z.array(CatalogItemSchema),
  reservations: z.array(ReservationLineSchema),
  errors: z.array(ErrorLogEntrySchema),
  messages: z.array(PharmacyChatMessageSchema),
  telegram_cards: z.array(TelegramCardSchema),
  last_run: ExecutionRunSchema.nullable(),
  updated_at: z.string(),
});

export const PharmacyMessageInputSchema = z.object({
  text: z
    .string()
    .trim()
    .max(500, "Message is limited to 500 characters.")
    .optional()
    .default(""),
  customer: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .optional()
    .default("Youssef Adel (Demo)"),
});

export const PharmacyMessageResponseSchema = z.object({
  ok: z.literal(true),
  request_id: z.string().nullable(),
  reply: z.string(),
  execution: ExecutionRunSchema,
  state: PharmacyStateSchema,
});

export const CALLBACK_DATA_REGEX = /^ph:(approve|reject):R-\d{6}-[A-Z0-9]{4}$/;

export const PharmacyDecisionRequestSchema = z.object({
  callback_data: z
    .string()
    .regex(CALLBACK_DATA_REGEX, "Invalid decision callback payload."),
  pharmacist: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .optional()
    .default("pharmacist_hala"),
  reason: z.string().trim().max(200).optional(),
});

export const PharmacyDecisionResponseSchema = z.object({
  ok: z.literal(true),
  decision_ok: z.boolean(),
  toast: z.string(),
  execution: ExecutionRunSchema,
  state: PharmacyStateSchema,
});

export const PharmacyResetResponseSchema = z.object({
  ok: z.literal(true),
  state: PharmacyStateSchema,
});

// ---------------------------------------------------------------------------
// Inferred Types
// ---------------------------------------------------------------------------

export type CatalogItem = z.infer<typeof CatalogItemSchema>;
export type ReservationStatus = z.infer<typeof ReservationStatusSchema>;
export type ReservationLine = z.infer<typeof ReservationLineSchema>;
export type ErrorLogEntry = z.infer<typeof ErrorLogEntrySchema>;
export type ExecutionStep = z.infer<typeof ExecutionStepSchema>;
export type ExecutionRun = z.infer<typeof ExecutionRunSchema>;
export type PharmacyChatMessage = z.infer<typeof PharmacyChatMessageSchema>;
export type AlternativeInfo = z.infer<typeof AlternativeInfoSchema>;
export type TelegramCardLine = z.infer<typeof TelegramCardLineSchema>;
export type TelegramCard = z.infer<typeof TelegramCardSchema>;
export type PharmacyState = z.infer<typeof PharmacyStateSchema>;
export type PharmacyMessageInput = z.infer<typeof PharmacyMessageInputSchema>;
export type PharmacyMessageResponse = z.infer<typeof PharmacyMessageResponseSchema>;
export type PharmacyDecisionRequest = z.infer<typeof PharmacyDecisionRequestSchema>;
export type PharmacyDecisionResponse = z.infer<typeof PharmacyDecisionResponseSchema>;
export type PharmacyResetResponse = z.infer<typeof PharmacyResetResponseSchema>;
