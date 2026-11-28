import { NextRequest, NextResponse } from "next/server";
import { jsonError, tooManyRequests } from "@/lib/hr/http";
import { checkRateLimit } from "@/lib/hr/rate-limit";
import {
  MozakraGradeRequestSchema,
  MozakraGradeResponseSchema,
} from "@/lib/mozakra/schemas";
import {
  MOZAKRA_DEFAULT_TIMEOUT_MS,
  mozakraUpstreamFetch,
} from "@/lib/mozakra/upstream";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, "mozakraGrade");
  if (!rl.success) {
    return tooManyRequests(
      rl,
      "Too many grading requests. Please wait a few minutes and try again."
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON request body.", 400);
  }

  const parsed = MozakraGradeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Invalid grading payload.",
      400
    );
  }

  const result = await mozakraUpstreamFetch({
    endpoint: "/mozakra/live/grade",
    method: "POST",
    body: {
      token: parsed.data.token.toLowerCase(),
      answers: parsed.data.answers,
    },
    schema: MozakraGradeResponseSchema,
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

