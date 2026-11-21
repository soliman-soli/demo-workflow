import { NextRequest, NextResponse } from "next/server";
import { jsonError, tooManyRequests } from "@/lib/hr/http";
import { checkRateLimit } from "@/lib/hr/rate-limit";
import {
  FenjanStatusQuerySchema,
  FenjanStatusResponseSchema,
} from "@/lib/fenjan/schemas";
import { fenjanUpstreamFetch } from "@/lib/fenjan/upstream";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(request, "fenjanStatus");
  if (!rl.success) {
    return tooManyRequests(rl, "Too many status requests. Slowing down briefly.");
  }

  const orderId = request.nextUrl.searchParams.get("orderId") ?? "";
  const parsed = FenjanStatusQuerySchema.safeParse({ orderId });
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Invalid order ID.",
      400
    );
  }

  const result = await fenjanUpstreamFetch({
    envName: "FENJAN_STATUS_URL",
    endpointLabel: "status",
    method: "GET",
    query: { orderId: parsed.data.orderId },
    schema: FenjanStatusResponseSchema,
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
