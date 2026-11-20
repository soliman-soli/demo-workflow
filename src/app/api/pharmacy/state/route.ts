import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/hr/rate-limit";
import { jsonError, tooManyRequests } from "@/lib/hr/http";
import { getPharmacyState } from "@/lib/pharmacy/engine";
import { isPharmacyMockMode, pharmacyN8nFetch } from "@/lib/pharmacy/n8n";
import { PharmacyStateSchema } from "@/lib/pharmacy/schemas";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(request, "pharmacyState");
  if (!rl.success) {
    return tooManyRequests(rl, "Too many status requests. Slowing down briefly.");
  }

  if (isPharmacyMockMode()) {
    const state = getPharmacyState();
    const validated = PharmacyStateSchema.safeParse(state);
    if (!validated.success) {
      return jsonError("Internal state error.", 500);
    }
    return NextResponse.json(validated.data, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const result = await pharmacyN8nFetch("/pharmacy/state", {
    method: "GET",
    schema: PharmacyStateSchema,
  });

  if (!result.ok) {
    return jsonError("Couldn't load pharmacy simulator state.", result.status);
  }

  return NextResponse.json(
    { ...result.data, mode: "live" as const },
    { headers: { "Cache-Control": "no-store" } }
  );
}
