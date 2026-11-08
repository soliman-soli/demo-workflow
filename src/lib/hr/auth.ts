import { NextRequest, NextResponse } from "next/server";
import {
  HR_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  safeEqual,
  signSession,
  verifySessionToken,
} from "./session";

export { HR_COOKIE_NAME };

/** Returns a signed token if the passcode matches HR_DEMO_PASSCODE, else null. */
export async function createSessionToken(passcode: string): Promise<string | null> {
  const expected = process.env.HR_DEMO_PASSCODE;
  if (!expected || !safeEqual(passcode.trim(), expected.trim())) return null;
  return signSession();
}

export async function verifyRequestSession(request: NextRequest): Promise<boolean> {
  return verifySessionToken(request.cookies.get(HR_COOKIE_NAME)?.value);
}

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setSessionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(HR_COOKIE_NAME, token, { ...cookieBase, maxAge: SESSION_MAX_AGE_SECONDS });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(HR_COOKIE_NAME, "", { ...cookieBase, maxAge: 0 });
  return response;
}

export function unauthorized() {
  return NextResponse.json(
    { ok: false, error: "Unauthorized. Please sign in with the HR passcode." },
    { status: 401 }
  );
}
