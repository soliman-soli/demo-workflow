import { NextRequest, NextResponse } from "next/server";
import { n8nFetch, isMockMode } from "@/lib/hr/n8n-fetch";
import { ApplyRequestSchema, ApplyResponseSchema } from "@/lib/hr/schemas";
import { validatePdfFile } from "@/lib/hr/file-validation";
import { checkRateLimit, getClientIp } from "@/lib/hr/rate-limit";
import { verifyTurnstile } from "@/lib/hr/turnstile";
import { buildForward, formFile, formString, sleep, tooManyRequests } from "@/lib/hr/http";
import { MOCK_APPLY_SUCCESS, MOCK_FAIL_TOKEN } from "@/lib/hr/mocks";

export const maxDuration = 60;

const fail = (errors: string[], status = 400) => NextResponse.json({ ok: false, errors }, { status });

export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(["Invalid form submission. Your CV must be 4 MB or smaller."]);
  }

  // Honeypot: respond like a success so bots learn nothing.
  if (formString(form, "hp_email")) return NextResponse.json(MOCK_APPLY_SUCCESS, { status: 202 });

  const parsed = ApplyRequestSchema.safeParse({
    name: formString(form, "name") ?? "",
    email: formString(form, "email") ?? "",
    linkedin: formString(form, "linkedin") ?? "",
    role_id: formString(form, "role_id") ?? "",
  });
  const errors: string[] = parsed.success ? [] : parsed.error.issues.map((i) => i.message);

  const cv = formFile(form, "cv");
  if (!cv) errors.push("Please upload your CV as a PDF.");
  else {
    const check = await validatePdfFile(cv);
    if (!check.valid) errors.push(check.error ?? "Your CV must be a valid PDF.");
  }
  if (formString(form, "consent") !== "true") errors.push("Please confirm you understand this is a demo.");

  if (!parsed.success || errors.length) return fail(errors);

  const turnstileOk = await verifyTurnstile(formString(form, "cf-turnstile-response") ?? null, getClientIp(request));
  if (!turnstileOk) return fail(["Bot check failed. Please refresh and try again."]);

  const rl = await checkRateLimit(request, "apply");
  if (!rl.success) return tooManyRequests(rl, "You can submit 3 applications per hour. Please try again later.");

  if (isMockMode()) {
    await sleep(1500);
    if (parsed.data.name.toLowerCase().includes(MOCK_FAIL_TOKEN)) {
      return fail(["We already have an application from this email for this role."]);
    }
    return NextResponse.json(MOCK_APPLY_SUCCESS, { status: 202 });
  }

  const result = await n8nFetch("/hr/apply", {
    method: "POST",
    body: buildForward({ ...parsed.data }, { cv: cv! }),
    schema: ApplyResponseSchema,
    acceptStatuses: [400],
  });
  if (!result.ok) return fail(["We couldn't submit your application. Please try again."], result.status);
  if (!result.data.ok) return fail(result.data.errors.length ? result.data.errors : ["Application was not accepted."]);
  // Only forward the message: never the score or decision.
  return NextResponse.json({ ok: true, message: result.data.message }, { status: 202 });
}
