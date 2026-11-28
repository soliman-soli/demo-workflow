import { randomBytes } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { MOZAKRA_HEX32_REGEX } from "./schemas";

export const MOZAKRA_SESSION_COOKIE = "mozakra_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours

/** Generates a 32-hex-character server-only session ID. */
export function generateMozakraSessionId(): string {
  return randomBytes(16).toString("hex");
}

/** Reads and validates the httpOnly Mozakra session cookie from a request. */
export function getMozakraSessionId(request: NextRequest): string | null {
  const val = request.cookies.get(MOZAKRA_SESSION_COOKIE)?.value;
  if (!val || !MOZAKRA_HEX32_REGEX.test(val)) return null;
  return val.toLowerCase();
}

/** Sets the httpOnly, Secure (in production), SameSite=Lax 24h session cookie. */
export function attachMozakraSessionCookie(
  response: NextResponse,
  sessionId: string
): void {
  response.cookies.set(MOZAKRA_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}
