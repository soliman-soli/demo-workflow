import { NextRequest, NextResponse } from "next/server";
import { n8nFetch, isMockMode } from "@/lib/hr/n8n-fetch";
import { CandidatesResponseSchema } from "@/lib/hr/schemas";
import { unauthorized, verifyRequestSession } from "@/lib/hr/auth";
import { jsonError } from "@/lib/hr/http";
import { mockListCandidates } from "@/lib/hr/mocks";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await verifyRequestSession(request))) return unauthorized();

  if (isMockMode()) return NextResponse.json(mockListCandidates());

  const result = await n8nFetch("/hr/candidates", { schema: CandidatesResponseSchema });
  if (!result.ok) return jsonError("Couldn't load candidates.", result.status);
  return NextResponse.json(result.data);
}
