import { SignJWT, jwtVerify } from "jose";

export const HR_COOKIE_NAME = "hr_session";
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours

/** Returns null when HR_DEMO_PASSCODE is not configured (dashboard disabled). */
function getSecret(): Uint8Array | null {
  const passcode = process.env.HR_DEMO_PASSCODE;
  if (!passcode) return null;
  // Derive the signing key from the passcode so rotating it invalidates sessions.
  return new TextEncoder().encode(`hr-demo-session:${passcode}`);
}

export async function signSession(): Promise<string | null> {
  const key = getSecret();
  if (!key) return null;
  return new SignJWT({ role: "hr" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(key);
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const key = getSecret();
  if (!key || !token) return false;
  try {
    await jwtVerify(token, key, { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

/** Constant-time string comparison to avoid timing leaks on the passcode. */
export function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  const len = Math.max(x.length, y.length);
  for (let i = 0; i < len; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

