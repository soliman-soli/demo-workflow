import type { NextRequest } from "next/server";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/** Named limits used by the POST routes. */
export const LIMITS = {
  chat: { limit: 20, windowMs: 60_000 },
  coach: { limit: 3, windowMs: 3_600_000 },
  apply: { limit: 3, windowMs: 3_600_000 },
  policies: { limit: 5, windowMs: 3_600_000 },
  login: { limit: 10, windowMs: 60_000 },
} as const;

export type LimitKey = keyof typeof LIMITS;

// ---------------------------------------------------------------------------
// In-memory sliding window (fallback; per server instance only)
// ---------------------------------------------------------------------------

const store = new Map<string, number[]>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, stamps] of store) {
    const fresh = stamps.filter((t) => now - t < 3_600_000);
    if (fresh.length === 0) store.delete(key);
    else store.set(key, fresh);
  }
}

export function rateLimitMemory(
  ip: string,
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const compositeKey = `${key}:${ip}`;
  const stamps = (store.get(compositeKey) ?? []).filter((t) => now - t < windowMs);

  if (stamps.length >= limit) {
    store.set(compositeKey, stamps);
    return { success: false, remaining: 0, reset: stamps[0] + windowMs };
  }

  stamps.push(now);
  store.set(compositeKey, stamps);
  return { success: true, remaining: limit - stamps.length, reset: stamps[0] + windowMs };
}

/** Kept for backwards compatibility with earlier callers. */
export const rateLimit = rateLimitMemory;

// ---------------------------------------------------------------------------
// Upstash Redis (fixed window via REST, no SDK dependency)
// ---------------------------------------------------------------------------

async function rateLimitUpstash(
  url: string,
  token: string,
  ip: string,
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const windowId = Math.floor(Date.now() / windowMs);
  const redisKey = `rl:${key}:${ip}:${windowId}`;
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["PEXPIRE", redisKey, String(windowMs)],
    ]),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  const data = (await res.json()) as Array<{ result: number }>;
  const count = Number(data[0]?.result ?? 0);
  const reset = (windowId + 1) * windowMs;
  return { success: count <= limit, remaining: Math.max(0, limit - count), reset };
}

/**
 * Rate-limit a request by client IP. Uses Upstash when
 * UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are set, otherwise memory.
 */
export async function checkRateLimit(
  request: NextRequest,
  key: LimitKey
): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  const { limit, windowMs } = LIMITS[key];
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      return await rateLimitUpstash(url, token, ip, key, limit, windowMs);
    } catch (err) {
      console.error("[rateLimit] Upstash failed, falling back to memory:", err);
    }
  }
  return rateLimitMemory(ip, key, limit, windowMs);
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}
