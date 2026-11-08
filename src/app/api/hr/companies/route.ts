import { NextResponse } from "next/server";
import { n8nFetch, isMockMode } from "@/lib/hr/n8n-fetch";
import { CompaniesResponseSchema } from "@/lib/hr/schemas";
import { jsonError } from "@/lib/hr/http";
import { mockListCompanies } from "@/lib/hr/mocks";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  if (isMockMode()) return NextResponse.json(mockListCompanies());

  const result = await n8nFetch("/hr/companies", { schema: CompaniesResponseSchema });
  if (!result.ok) return jsonError("Couldn't load companies.", result.status);
  return NextResponse.json(result.data);
}
