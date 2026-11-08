import { NextRequest, NextResponse } from "next/server";
import { n8nFetch, isMockMode } from "@/lib/hr/n8n-fetch";
import { PoliciesResponseSchema, PolicyFormSchema } from "@/lib/hr/schemas";
import { validatePdfFile } from "@/lib/hr/file-validation";
import { checkRateLimit } from "@/lib/hr/rate-limit";
import { buildForward, formFile, formString, jsonError, sleep, tooManyRequests } from "@/lib/hr/http";
import { mockAddPolicies } from "@/lib/hr/mocks";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, "policies");
  if (!rl.success) return tooManyRequests(rl, "You can add policies up to 5 times per hour.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Invalid form submission. Files must be 4 MB or smaller.", 400);
  }

  const parsed = PolicyFormSchema.safeParse({
    company: formString(form, "company"),
    title: formString(form, "title"),
    text: formString(form, "text"),
  });
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 400);

  const file = formFile(form, "file");
  const { company, title, text } = parsed.data;

  if (file) {
    const check = await validatePdfFile(file);
    if (!check.valid) return jsonError(check.error ?? "Invalid PDF.", 400);
  } else if (!title || !text) {
    return jsonError("Add a policy title and text, or upload a PDF.", 400);
  }

  if (isMockMode()) {
    await sleep(900);
    const added = file ? 7 : Math.max(1, Math.ceil((text?.length ?? 0) / 400));
    return NextResponse.json(mockAddPolicies(company, added));
  }

  const forward = file
    ? buildForward({ company }, { file })
    : buildForward({ company, title, text });

  const result = await n8nFetch("/hr/policies/add", {
    method: "POST",
    body: forward,
    schema: PoliciesResponseSchema,
  });
  if (!result.ok) return jsonError("Couldn't save the policies. Please try again.", result.status);
  return NextResponse.json(result.data);
}
