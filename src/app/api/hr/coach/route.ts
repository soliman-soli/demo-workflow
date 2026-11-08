import { NextRequest, NextResponse } from "next/server";
import { n8nFetch, isMockMode } from "@/lib/hr/n8n-fetch";
import { CoachRequestSchema, CoachResponseSchema } from "@/lib/hr/schemas";
import { validatePdfFile } from "@/lib/hr/file-validation";
import { checkRateLimit, getClientIp } from "@/lib/hr/rate-limit";
import { verifyTurnstile } from "@/lib/hr/turnstile";
import { buildForward, formFile, formString, jsonError, sleep, tooManyRequests } from "@/lib/hr/http";
import { MOCK_COACH_REPORT, MOCK_FAIL_TOKEN } from "@/lib/hr/mocks";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Invalid form submission. Files must be 4 MB or smaller.", 400);
  }

  // Honeypot: pretend success without doing any work.
  if (formString(form, "hp_name")) {
    return NextResponse.json({ ok: false, error: "Please try again later." }, { status: 200 });
  }

  const parsed = CoachRequestSchema.safeParse({
    name: formString(form, "name"),
    email: formString(form, "email"),
    role: formString(form, "role"),
    job_description: formString(form, "job_description"),
  });
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 400);

  const cv = formFile(form, "cv");
  if (!cv) return jsonError("Please upload your CV as a PDF.", 400);
  const check = await validatePdfFile(cv);
  if (!check.valid) return jsonError(check.error ?? "Invalid PDF.", 400);

  const turnstileOk = await verifyTurnstile(formString(form, "cf-turnstile-response") ?? null, getClientIp(request));
  if (!turnstileOk) return jsonError("Bot check failed. Please refresh and try again.", 400);

  // Rate limit after validation so typos don't burn the 3/hour quota.
  const rl = await checkRateLimit(request, "coach");
  if (!rl.success) return tooManyRequests(rl, "You can request 3 coaching reports per hour. Please try again later.");

  if (isMockMode()) {
    await sleep(3500);
    if (parsed.data.role.toLowerCase().includes(MOCK_FAIL_TOKEN)) {
      return NextResponse.json({ ok: false, error: "We couldn't read text from that CV. Try exporting it again as a PDF." });
    }
    return NextResponse.json(MOCK_COACH_REPORT);
  }

  const { name, email, role, job_description } = parsed.data;
  const result = await n8nFetch("/hr/coach", {
    method: "POST",
    body: buildForward({ name, email, role, job_description }, { cv }),
    schema: CoachResponseSchema,
  });
  if (!result.ok) return jsonError("The coach couldn't finish your report. Please try again.", result.status);
  return NextResponse.json(result.data);
}
