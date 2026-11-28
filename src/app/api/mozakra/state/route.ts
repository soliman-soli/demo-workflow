import { NextRequest, NextResponse } from "next/server";
import { jsonError, tooManyRequests } from "@/lib/hr/http";
import { checkRateLimit } from "@/lib/hr/rate-limit";
import { MozakraStateResponseSchema } from "@/lib/mozakra/schemas";
import { getMozakraSessionId } from "@/lib/mozakra/session";
import {
  MOZAKRA_DEFAULT_TIMEOUT_MS,
  mozakraUpstreamFetch,
} from "@/lib/mozakra/upstream";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, "mozakraState");
  if (!rl.success) {
    return tooManyRequests(
      rl,
      "Too many requests. Please wait a few minutes and try again."
    );
  }

  const sessionId = getMozakraSessionId(request);
  if (!sessionId) {
    return jsonError("No active study session. Generate a quiz first.", 400);
  }

  const result = await mozakraUpstreamFetch({
    endpoint: "/mozakra/live/state",
    method: "POST",
    body: { sessionId },
    schema: MozakraStateResponseSchema,
    timeoutMs: MOZAKRA_DEFAULT_TIMEOUT_MS,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status }
    );
  }

  if (!result.data.ok) {
    const errStatus =
      result.data.status && result.data.status >= 400
        ? result.data.status
        : result.status >= 400
          ? result.status
          : 422;
    return NextResponse.json(
      { ok: false, status: errStatus, error: result.data.error },
      { status: errStatus }
    );
  }

  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "no-store" },
  });
}
