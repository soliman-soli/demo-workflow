import { NextRequest, NextResponse } from "next/server";
import { jsonError, tooManyRequests } from "@/lib/hr/http";
import { checkRateLimit } from "@/lib/hr/rate-limit";
import {
  FenjanChatRequestSchema,
  FenjanChatResponseSchema,
} from "@/lib/fenjan/schemas";
import { fenjanUpstreamFetch } from "@/lib/fenjan/upstream";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, "fenjanChat");
  if (!rl.success) {
    return tooManyRequests(rl, "Too many messages sent. Please wait a minute.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const parsed = FenjanChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid request.", 400);
  }

  const forwardPayload: {
    sessionId: string;
    message: string;
    name?: string;
  } = {
    sessionId: parsed.data.sessionId,
    message: parsed.data.message,
  };
  if (parsed.data.name) {
    forwardPayload.name = parsed.data.name;
  }

  const result = await fenjanUpstreamFetch({
    envName: "FENJAN_PORTAL_URL",
    endpointLabel: "chat",
    method: "POST",
    body: forwardPayload,
    schema: FenjanChatResponseSchema,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        ...(result.notConnected ? { notConnected: true } : {}),
      },
      { status: result.status }
    );
  }

  return NextResponse.json(result.rawJson, {
    headers: { "Cache-Control": "no-store" },
  });
}
