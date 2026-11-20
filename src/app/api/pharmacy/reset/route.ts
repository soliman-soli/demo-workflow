import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/hr/rate-limit";
import { jsonError, sleep, tooManyRequests } from "@/lib/hr/http";
import { resetPharmacyState } from "@/lib/pharmacy/engine";
import { isPharmacyMockMode, pharmacyN8nFetch } from "@/lib/pharmacy/n8n";
import { PharmacyResetResponseSchema } from "@/lib/pharmacy/schemas";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, "pharmacyReset");
  if (!rl.success) {
    return tooManyRequests(rl, "Reset rate limit reached. Please wait a minute.");
  }

  if (isPharmacyMockMode()) {
    await sleep(150);
    const state = resetPharmacyState();
    return NextResponse.json({ ok: true, state });
  }

  const result = await pharmacyN8nFetch("/pharmacy/reset", {
    method: "POST",
    body: { reset: true },
    schema: PharmacyResetResponseSchema,
  });

  if (!result.ok) {
    return jsonError("Couldn't reset the pharmacy demo.", result.status);
  }

  return NextResponse.json(result.data);
}
