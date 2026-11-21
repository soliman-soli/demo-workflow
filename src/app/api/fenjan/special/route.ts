import { NextRequest, NextResponse } from "next/server";
import { tooManyRequests } from "@/lib/hr/http";
import { checkRateLimit } from "@/lib/hr/rate-limit";
import { FenjanSpecialResponseSchema } from "@/lib/fenjan/schemas";
import { fenjanUpstreamFetch } from "@/lib/fenjan/upstream";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(request, "fenjanSpecial");
  if (!rl.success) {
    return tooManyRequests(rl, "Too many requests. Please try again shortly.");
  }

  const result = await fenjanUpstreamFetch({
    envName: "FENJAN_SPECIALS_URL",
    endpointLabel: "special",
    method: "GET",
    schema: FenjanSpecialResponseSchema,
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
