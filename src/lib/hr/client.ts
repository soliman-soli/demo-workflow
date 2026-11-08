import type { ZodType } from "zod";

export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; errors?: string[]; status: number };

/**
 * Browser-side fetch to our own /api/hr routes. Validates the JSON with
 * the given schema and normalises every failure into { ok:false, error }.
 */
export async function api<T>(url: string, schema: ZodType<T>, init?: RequestInit): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", ...init });
  } catch {
    return { ok: false, error: "You appear to be offline. Check your connection and try again.", status: 0 };
  }

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    /* handled below */
  }

  if (!res.ok) {
    const body = (json ?? {}) as { error?: unknown; errors?: unknown };
    const errors = Array.isArray(body.errors) ? body.errors.filter((e): e is string => typeof e === "string") : undefined;
    const error =
      typeof body.error === "string" ? body.error : errors?.[0] ?? `Something went wrong (${res.status}). Please try again.`;
    return { ok: false, error, errors, status: res.status };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, error: "We received an unexpected response. Please try again.", status: res.status };
  }
  return { ok: true, data: parsed.data, status: res.status };
}

