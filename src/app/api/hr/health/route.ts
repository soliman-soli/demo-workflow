import { NextResponse } from "next/server";
import { n8nFetch, isMockMode } from "@/lib/hr/n8n-fetch";
import { HealthResponseSchema } from "@/lib/hr/schemas";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  if (isMockMode()) {
    return NextResponse.json({ status: "live", time: new Date().toISOString() });
  }
  const result = await n8nFetch("/hr/health", { schema: HealthResponseSchema, timeoutMs: 10_000 });
  if (!result.ok) {
    return NextResponse.json({ status: "offline" }, { status: 503 });
  }
  return NextResponse.json(result.data);
}
