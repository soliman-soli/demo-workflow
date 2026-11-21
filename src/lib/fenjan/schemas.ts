import { z } from "zod";

export const FENJAN_SESSION_ID_REGEX = /^[\w-]{1,64}$/;
export const FENJAN_ORDER_ID_REGEX = /^[A-Z0-9-]{1,32}$/;

// ---------------------------------------------------------------------------
// POST /api/fenjan/chat
// ---------------------------------------------------------------------------

export const FenjanChatRequestSchema = z.object({
  sessionId: z
    .string()
    .regex(FENJAN_SESSION_ID_REGEX, "Invalid session ID."),
  message: z
    .string()
    .trim()
    .min(1, "Please enter a message.")
    .max(1000, "Message must be 1000 characters or fewer."),
  name: z.string().trim().max(80).optional(),
});

export const FenjanCartItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  qty: z.number(),
  lineTotal: z.number(),
});

export const FenjanCartSchema = z.object({
  items: z.array(FenjanCartItemSchema),
  mode: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  subtotal: z.number(),
  deliveryFee: z.number(),
  total: z.number(),
  currency: z.string(),
});

export const FenjanChatResponseSchema = z.object({
  reply: z.string(),
  sessionId: z.string(),
  orderId: z.string().nullable().optional(),
  intent: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  open: z.boolean().optional(),
  openHour: z.union([z.number(), z.string()]).nullable().optional(),
  cart: FenjanCartSchema.nullable().optional(),
  staffAlert: z.string().nullable().optional(),
});

// ---------------------------------------------------------------------------
// GET /api/fenjan/status
// ---------------------------------------------------------------------------

export const FenjanStatusQuerySchema = z.object({
  orderId: z
    .string()
    .regex(FENJAN_ORDER_ID_REGEX, "Invalid order ID."),
});

export const FenjanStatusResponseSchema = z.object({
  found: z.boolean(),
  orderId: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  label_en: z.string().nullable().optional(),
  label_ar: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

// ---------------------------------------------------------------------------
// GET /api/fenjan/special
// ---------------------------------------------------------------------------

export const FenjanSpecialResponseSchema = z.object({
  found: z.boolean(),
  id: z.string().nullable().optional(),
  text_en: z.string().nullable().optional(),
  text_ar: z.string().nullable().optional(),
  postedAt: z.string().nullable().optional(),
});

// ---------------------------------------------------------------------------
// Inferred Types
// ---------------------------------------------------------------------------

export type FenjanChatRequest = z.infer<typeof FenjanChatRequestSchema>;
export type FenjanCartItem = z.infer<typeof FenjanCartItemSchema>;
export type FenjanCart = z.infer<typeof FenjanCartSchema>;
export type FenjanChatResponse = z.infer<typeof FenjanChatResponseSchema>;
export type FenjanStatusQuery = z.infer<typeof FenjanStatusQuerySchema>;
export type FenjanStatusResponse = z.infer<typeof FenjanStatusResponseSchema>;
export type FenjanSpecialResponse = z.infer<typeof FenjanSpecialResponseSchema>;
