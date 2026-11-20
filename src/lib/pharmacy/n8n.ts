import type { ZodType } from "zod";
import { n8nFetch, type N8nResult } from "@/lib/hr/n8n-fetch";

/**
 * Pharmacy demo runs in mock mode when USE_MOCKS=true OR when the pharmacy
 * n8n env vars (N8N_PHARMACY_BASE_URL / N8N_SECRET) are not configured.
 */
export function isPharmacyMockMode(): boolean {
  if (process.env.USE_MOCKS === "true") return true;
  return !process.env.N8N_PHARMACY_BASE_URL || !process.env.N8N_SECRET;
}

/**
 * Server-only fetch to the Dawaa Pharmacy n8n webhooks using
 * N8N_PHARMACY_BASE_URL and N8N_SECRET (sent via X-API-KEY).
 */
export function pharmacyN8nFetch<T = unknown>(
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: unknown;
    schema?: ZodType<T>;
    timeoutMs?: number;
    acceptStatuses?: number[];
  } = {}
): Promise<N8nResult<T>> {
  return n8nFetch<T>(path, {
    ...options,
    baseUrl: process.env.N8N_PHARMACY_BASE_URL,
    secretKey: process.env.N8N_SECRET,
    secretHeader: "X-API-KEY",
  });
}

/**
 * Formats a browser message into the exact WhatsApp Business Cloud webhook
 * envelope expected by the n8n WhatsApp Trigger / Demo Webhook.
 */
export function buildWhatsAppWebhookPayload(params: {
  text: string;
  customer: string;
  hasImage: boolean;
  imageName?: string;
  imageMimeType?: string;
}) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const messageId = `wamid.demo.${Date.now()}`;

  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "demo-waba-id",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              contacts: [
                {
                  profile: { name: params.customer },
                  wa_id: "201000000000",
                },
              ],
              messages: [
                params.hasImage
                  ? {
                      from: "201000000000",
                      id: messageId,
                      timestamp,
                      type: "image",
                      image: {
                        id: `media-${Date.now()}`,
                        mime_type: params.imageMimeType ?? "image/png",
                        caption: params.text || "",
                        filename: params.imageName ?? "prescription.png",
                      },
                    }
                  : {
                      from: "201000000000",
                      id: messageId,
                      timestamp,
                      type: "text",
                      text: { body: params.text },
                    },
              ],
            },
          },
        ],
      },
    ],
  };
}

/**
 * Formats a dashboard button click into a real Telegram Bot API
 * callback_query envelope expected by the n8n Telegram Decision workflow.
 */
export function buildTelegramCallbackPayload(params: {
  callback_data: string;
  pharmacist: string;
  reason?: string;
}) {
  return {
    update_id: Math.floor(Date.now() / 1000),
    callback_query: {
      id: `cbq-${Date.now()}`,
      from: {
        id: 90123456,
        is_bot: false,
        first_name: params.pharmacist,
        username: params.pharmacist,
      },
      message: {
        message_id: 1001,
        chat: {
          id: -100999888777,
          title: "Dawaa Pharmacists",
          type: "supergroup",
        },
      },
      data: params.callback_data,
    },
    reason: params.reason,
  };
}
