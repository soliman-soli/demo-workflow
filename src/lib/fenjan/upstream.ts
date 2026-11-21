import type { ZodType } from "zod";

export const FENJAN_TIMEOUT_MS = 20_000;

export type FenjanEnvVar =
  | "FENJAN_PORTAL_URL"
  | "FENJAN_STATUS_URL"
  | "FENJAN_SPECIALS_URL";

const FENJAN_FALLBACK_PATHS: Record<FenjanEnvVar, string> = {
  FENJAN_PORTAL_URL: "/fenjan-portal",
  FENJAN_STATUS_URL: "/fenjan-status",
  FENJAN_SPECIALS_URL: "/fenjan-specials",
};

/**
 * Resolves the Fenjan webhook URL: prefers the explicit FENJAN_*_URL override
 * and automatically falls back to N8N_BASE_URL + /fenjan-* (adding /webhook
 * if N8N_BASE_URL does not already end with /webhook or /webhook-test).
 */
export function resolveFenjanUrl(envName: FenjanEnvVar): string | null {
  const explicit = process.env[envName]?.trim();
  if (explicit) return explicit;

  const base = process.env.N8N_BASE_URL?.trim();
  if (!base) return null;

  const cleanBase = base.replace(/\/+$/, "");
  const lower = cleanBase.toLowerCase();
  const suffix = FENJAN_FALLBACK_PATHS[envName];
  if (lower.endsWith("/webhook") || lower.endsWith("/webhook-test")) {
    return `${cleanBase}${suffix}`;
  }
  return `${cleanBase}/webhook${suffix}`;
}

export type FenjanUpstreamResult =
  | { ok: true; rawJson: unknown; status: number }
  | { ok: false; error: string; status: number; notConnected?: boolean };

/**
 * Server-only helper to call Fenjan n8n webhooks.
 * Enforces a 20s timeout, validates upstream JSON against a zod schema,
 * attaches X-API-KEY when N8N_WEBHOOK_KEY is configured, and never logs
 * customer message bodies, URLs, or secrets.
 */
export async function fenjanUpstreamFetch<T>(params: {
  envName: FenjanEnvVar;
  endpointLabel: string;
  method: "GET" | "POST";
  query?: Record<string, string>;
  body?: unknown;
  schema: ZodType<T>;
  timeoutMs?: number;
}): Promise<FenjanUpstreamResult> {
  const rawUrl = resolveFenjanUrl(params.envName);
  if (!rawUrl) {
    return {
      ok: false,
      notConnected: true,
      status: 503,
      error: "Fenjan Café is not connected yet.",
    };
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    console.error(`[fenjan] ${params.endpointLabel} URL format is invalid`);
    return {
      ok: false,
      notConnected: true,
      status: 503,
      error: "Fenjan Café webhook URL is invalid.",
    };
  }

  if (params.query) {
    for (const [key, value] of Object.entries(params.query)) {
      targetUrl.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  const apiKey = process.env.N8N_WEBHOOK_KEY?.trim();
  if (apiKey) {
    headers["X-API-KEY"] = apiKey;
  }
  if (params.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    params.timeoutMs ?? FENJAN_TIMEOUT_MS
  );

  try {
    const res = await fetch(targetUrl.toString(), {
      method: params.method,
      headers,
      body: params.body !== undefined ? JSON.stringify(params.body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`[fenjan] ${params.method} ${params.endpointLabel} -> ${res.status}`);
      return {
        ok: false,
        status: 502,
        error: "The café bot returned an error. Please try again.",
      };
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      console.error(`[fenjan] ${params.method} ${params.endpointLabel} returned non-JSON`);
      return {
        ok: false,
        status: 502,
        error: "Unexpected response from the café bot.",
      };
    }

    const parsed = params.schema.safeParse(json);
    if (!parsed.success) {
      const issuePaths = parsed.error.issues
        .slice(0, 5)
        .map((i) => i.path.join(".") || "root")
        .join(", ");
      console.error(
        `[fenjan] ${params.endpointLabel} schema mismatch at: ${issuePaths}`
      );
      return {
        ok: false,
        status: 502,
        error: "Unexpected response format from the café bot.",
      };
    }

    return { ok: true, rawJson: json, status: res.status };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error(`[fenjan] ${params.method} ${params.endpointLabel} timed out`);
      return {
        ok: false,
        status: 504,
        error: "The café bot took too long to respond. Please try again.",
      };
    }

    console.error(`[fenjan] ${params.method} ${params.endpointLabel} network error`);
    return {
      ok: false,
      status: 503,
      error: "Could not reach the café bot. Please try again.",
    };
  } finally {
    clearTimeout(timer);
  }
}
