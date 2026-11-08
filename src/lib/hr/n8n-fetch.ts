import type { ZodType } from "zod";

export type N8nResult<T> = { ok: true; data: T; status: number } | { ok: false; error: string; status: number };

export const N8N_TIMEOUT_MS = 60_000;

export function isMockMode(): boolean {
  return process.env.USE_MOCKS === "true";
}

interface N8nFetchOptions<T> {
  method?: "GET" | "POST";
  /** JSON-serialisable body or FormData (multipart). */
  body?: unknown;
  /** When provided, the upstream JSON is validated and typed with this schema. */
  schema?: ZodType<T>;
  /** Override for tests. */
  timeoutMs?: number;
  /** Treat these non-2xx statuses as parseable payloads (e.g. 400 from /hr/apply). */
  acceptStatuses?: number[];
}

/**
 * Server-only fetch to n8n. Adds X-API-KEY, enforces a timeout and never
 * surfaces upstream URLs, bodies or stack traces to the caller.
 */
export async function n8nFetch<T = unknown>(
  path: string,
  options: N8nFetchOptions<T> = {}
): Promise<N8nResult<T>> {
  const base = process.env.N8N_BASE_URL;
  const key = process.env.N8N_WEBHOOK_KEY;
  if (!base || !key) {
    console.error("[n8nFetch] N8N_BASE_URL or N8N_WEBHOOK_KEY is not configured");
    return { ok: false, error: "Service is not configured", status: 503 };
  }

  const { method = "GET", body, schema, timeoutMs = N8N_TIMEOUT_MS, acceptStatuses = [] } = options;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const headers: Record<string, string> = { "X-API-KEY": key, Accept: "application/json" };
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${base.replace(/\/+$/, "")}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok && !acceptStatuses.includes(res.status)) {
      const text = await res.text().catch(() => "");
      console.error(`[n8nFetch] ${method} ${path} -> ${res.status}: ${text.slice(0, 500)}`);
      return { ok: false, error: "The service returned an error. Please try again.", status: 502 };
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      console.error(`[n8nFetch] ${method} ${path} returned non-JSON`);
      return { ok: false, error: "Unexpected response from the service.", status: 502 };
    }

    if (schema) {
      const parsed = schema.safeParse(json);
      if (!parsed.success) {
        console.error(`[n8nFetch] ${path} schema mismatch:`, parsed.error.issues.slice(0, 5));
        return { ok: false, error: "Unexpected response from the service.", status: 502 };
      }
      return { ok: true, data: parsed.data, status: res.status };
    }
    return { ok: true, data: json as T, status: res.status };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error(`[n8nFetch] ${method} ${path} timed out after ${timeoutMs}ms`);
      return { ok: false, error: "The request took too long. Please try again.", status: 504 };
    }
    console.error(`[n8nFetch] ${method} ${path} network error:`, err);
    return { ok: false, error: "Service unavailable. Please try again.", status: 503 };
  } finally {
    clearTimeout(timer);
  }
}
