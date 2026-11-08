import { NextRequest, NextResponse } from "next/server";
import { LoginRequestSchema } from "@/lib/hr/schemas";
import { createSessionToken, setSessionCookie } from "@/lib/hr/auth";
import { checkRateLimit } from "@/lib/hr/rate-limit";
import { jsonError, tooManyRequests } from "@/lib/hr/http";

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, "login");
  if (!rl.success) return tooManyRequests(rl, "Too many attempts. Please wait a minute.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const parsed = LoginRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please enter the passcode.", 400);

  const token = await createSessionToken(parsed.data.passcode);
  if (!token) return jsonError("That passcode isn't right.", 401);

  return setSessionCookie(NextResponse.json({ ok: true }), token);
}
