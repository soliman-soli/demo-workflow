import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/hr/rate-limit";
import { jsonError, sleep, tooManyRequests } from "@/lib/hr/http";
import { processPharmacyDecision } from "@/lib/pharmacy/engine";
import {
  buildTelegramCallbackPayload,
  isPharmacyMockMode,
  pharmacyN8nFetch,
} from "@/lib/pharmacy/n8n";
import {
  PharmacyDecisionRequestSchema,
  PharmacyDecisionResponseSchema,
} from "@/lib/pharmacy/schemas";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, "pharmacyDecision");
  if (!rl.success) {
    return tooManyRequests(rl, "Too many decisions sent. Please wait a minute.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const parsed = PharmacyDecisionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Invalid decision payload.",
      400
    );
  }

  if (isPharmacyMockMode()) {
    await sleep(200);
    const mockRes = processPharmacyDecision({
      callback_data: parsed.data.callback_data,
      pharmacist: parsed.data.pharmacist,
      reason: parsed.data.reason,
    });
    const validated = PharmacyDecisionResponseSchema.safeParse(mockRes);
    if (!validated.success) {
      console.error("[pharmacy/decision] Mock schema mismatch:", validated.error.issues);
      return jsonError("Internal simulation error.", 500);
    }
    return NextResponse.json(validated.data);
  }

  const tgPayload = buildTelegramCallbackPayload(parsed.data);
  const result = await pharmacyN8nFetch("/pharmacy/decision", {
    method: "POST",
    body: tgPayload,
    schema: PharmacyDecisionResponseSchema,
  });

  if (!result.ok) {
    return jsonError(
      "Couldn't process pharmacist decision right now. Please try again.",
      result.status
    );
  }

  return NextResponse.json(result.data);
}
