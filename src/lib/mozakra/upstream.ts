import type { ZodType } from "zod";
import { MOZAKRA_MAX_PDF_BYTES } from "./schemas";

export const MOZAKRA_START_TIMEOUT_MS = 55_000;
export const MOZAKRA_DEFAULT_TIMEOUT_MS = 15_000;
export const MOZAKRA_OFFLINE_ERROR =
  "The live demo backend is offline right now.";

const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

export type MozakraLiveEndpoint =
  | "/mozakra/live/start"
  | "/mozakra/live/grade"
  | "/mozakra/live/next"
  | "/mozakra/live/state"
  | "/mozakra/live/overview";

export interface PdfCheckResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a PDF file uploaded to Mozakra: application/pdf MIME,
 * non-empty, <= 5 MB, and %PDF- magic bytes.
 */
export async function validateMozakraPdf(file: File): Promise<PdfCheckResult> {
  if (!file || !(file instanceof File)) {
    return { valid: false, error: "No PDF file provided." };
  }

  if (file.size === 0) {
    return { valid: false, error: "The uploaded PDF file is empty." };
  }

  if (file.size > MOZAKRA_MAX_PDF_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `PDF is too large (${sizeMb} MB). Maximum allowed size is 5 MB.`,
    };
  }

  if (file.type !== "application/pdf") {
    return {
      valid: false,
      error: "Only PDF files (application/pdf) are accepted.",
    };
  }

  try {
    const buf = await file.slice(0, 5).arrayBuffer();
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < PDF_MAGIC_BYTES.length; i++) {
      if (bytes[i] !== PDF_MAGIC_BYTES[i]) {
        return {
          valid: false,
          error: "File header is invalid. Please upload a real PDF document.",
        };
      }
    }
  } catch {
    return { valid: false, error: "Could not read the uploaded PDF file." };
  }

  return { valid: true };
}

/**
 * Resolves the Mozakra webhook URL from N8N_BASE_URL.
 * Works whether N8N_BASE_URL is a bare host (https://host) or already ends
 * with /webhook (https://host/webhook).
 */
export function resolveMozakraUrl(
  endpoint: MozakraLiveEndpoint
): string | null {
  const base = process.env.N8N_BASE_URL?.trim();
  if (!base) return null;

  const cleanBase = base.replace(/\/+$/, "");
  const lower = cleanBase.toLowerCase();
  if (lower.endsWith("/webhook") || lower.endsWith("/webhook-test")) {
    return `${cleanBase}${endpoint}`;
  }
  return `${cleanBase}/webhook${endpoint}`;
}

export type MozakraUpstreamResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status: number };

/**
 * Server-only fetch to Mozakra's n8n Portal Live workflow.
 * Sends x-api-key: N8N_MOZAKRA_KEY (and ngrok-skip-browser-warning on ngrok
 * hosts), enforces AbortController timeout, and never logs keys, cookies,
 * lecture text, or raw n8n bodies.
 */
export async function mozakraUpstreamFetch<T>(params: {
  endpoint: MozakraLiveEndpoint;
  method?: "GET" | "POST";
  body?: unknown;
  schema: ZodType<T>;
  timeoutMs: number;
}): Promise<MozakraUpstreamResult<T>> {
  const targetUrlStr = resolveMozakraUrl(params.endpoint);
  const apiKey =
    process.env.N8N_MOZAKRA_KEY?.trim() ||
    process.env.N8N_WEBHOOK_KEY?.trim() ||
    process.env.N8N_SECRET?.trim();

  if (!targetUrlStr || !apiKey) {
    return { ok: false, status: 503, error: MOZAKRA_OFFLINE_ERROR };
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(targetUrlStr);
  } catch {
    console.error(`[mozakra] ${params.endpoint} URL is invalid`);
    return { ok: false, status: 503, error: MOZAKRA_OFFLINE_ERROR };
  }

  const method = params.method ?? "POST";
  const isForm =
    typeof FormData !== "undefined" && params.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "x-api-key": apiKey,
  };
  if (targetUrl.hostname.toLowerCase().includes("ngrok")) {
    headers["ngrok-skip-browser-warning"] = "true";
  }
  if (params.body !== undefined && !isForm) {
    headers["Content-Type"] = "application/json";
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), params.timeoutMs);

  try {
    const res = await fetch(targetUrl.toString(), {
      method,
      headers,
      body:
        params.body === undefined
          ? undefined
          : isForm
            ? (params.body as FormData)
            : JSON.stringify(params.body),
      signal: controller.signal,
      cache: "no-store",
    });

    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      console.error(
        `[mozakra] ${method} ${params.endpoint} -> ${res.status} (non-JSON)`
      );
      return { ok: false, status: 502, error: MOZAKRA_OFFLINE_ERROR };
    }

    const parsed = params.schema.safeParse(json);
    if (!parsed.success) {
      console.error(
        `[mozakra] ${method} ${params.endpoint} -> ${res.status} (schema mismatch)`
      );
      return { ok: false, status: 502, error: MOZAKRA_OFFLINE_ERROR };
    }

    return { ok: true, data: parsed.data, status: res.status };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error(`[mozakra] ${method} ${params.endpoint} timed out`);
      return { ok: false, status: 504, error: MOZAKRA_OFFLINE_ERROR };
    }
    console.error(`[mozakra] ${method} ${params.endpoint} unreachable`);
    return { ok: false, status: 503, error: MOZAKRA_OFFLINE_ERROR };
  } finally {
    clearTimeout(timer);
  }
}

