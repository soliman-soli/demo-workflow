import { NextRequest, NextResponse } from "next/server";
import { formFile, jsonError, tooManyRequests } from "@/lib/hr/http";
import { checkRateLimit } from "@/lib/hr/rate-limit";
import {
  MozakraStartTextRequestSchema,
  MozakraStartUpstreamResponseSchema,
} from "@/lib/mozakra/schemas";
import {
  attachMozakraSessionCookie,
  generateMozakraSessionId,
} from "@/lib/mozakra/session";
import {
  MOZAKRA_START_TIMEOUT_MS,
  mozakraUpstreamFetch,
  validateMozakraPdf,
} from "@/lib/mozakra/upstream";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, "mozakraStart");
  if (!rl.success) {
    return tooManyRequests(
      rl,
      "You can generate up to 5 quizzes every 10 minutes. Please try again shortly."
    );
  }

  const sessionId = generateMozakraSessionId();
  const contentType = request.headers.get("content-type") ?? "";
  let forwardBody: FormData | { sessionId: string; text: string };

  if (contentType.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return jsonError(
        "Invalid upload payload. PDF files must be 5 MB or smaller.",
        400
      );
    }

    const pdf = formFile(form, "file");
    if (!pdf) {
      return jsonError("Please attach a PDF file in the 'file' field.", 400);
    }

    const check = await validateMozakraPdf(pdf);
    if (!check.valid) {
      return jsonError(check.error ?? "Invalid PDF file.", 400);
    }

    const out = new FormData();
    out.append("sessionId", sessionId);
    out.append("file", pdf, pdf.name || "lecture.pdf");
    forwardBody = out;
  } else {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON request body.", 400);
    }

    const parsed = MozakraStartTextRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        parsed.error.issues[0]?.message ?? "Invalid lecture text.",
        400
      );
    }

    forwardBody = { sessionId, text: parsed.data.text };
  }

  const result = await mozakraUpstreamFetch({
    endpoint: "/mozakra/live/start",
    method: "POST",
    body: forwardBody,
    schema: MozakraStartUpstreamResponseSchema,
    timeoutMs: MOZAKRA_START_TIMEOUT_MS,
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

  // Strip sessionId from client JSON; store it strictly in the httpOnly cookie.
  const { sessionId: upstreamSessionId, ...clientPayload } = result.data;
  const cookieSession =
    upstreamSessionId && /^[a-f0-9]{32}$/i.test(upstreamSessionId)
      ? upstreamSessionId.toLowerCase()
      : sessionId;

  const response = NextResponse.json(clientPayload, {
    headers: { "Cache-Control": "no-store" },
  });
  attachMozakraSessionCookie(response, cookieSession);
  return response;
}
