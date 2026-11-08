import { NextResponse } from "next/server";
import type { RateLimitResult } from "./rate-limit";

export function jsonError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export function tooManyRequests(rl: RateLimitResult, message: string) {
  const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
  return NextResponse.json(
    { ok: false, error: message, errors: [message] },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

/** Reads a FormData string field; returns undefined for missing/empty values. */
export function formString(form: FormData, key: string): string | undefined {
  const value = form.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export function formFile(form: FormData, key: string): File | null {
  const value = form.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

/** Rebuilds a clean FormData containing only allow-listed fields. */
export function buildForward(fields: Record<string, string | undefined>, files: Record<string, File | null> = {}) {
  const out = new FormData();
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) out.append(k, v);
  for (const [k, f] of Object.entries(files)) if (f) out.append(k, f, f.name || `${k}.pdf`);
  return out;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

