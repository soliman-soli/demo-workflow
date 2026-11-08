import { NextResponse } from "next/server";
import { n8nFetch, isMockMode } from "@/lib/hr/n8n-fetch";
import { RolesResponseSchema } from "@/lib/hr/schemas";
import { jsonError } from "@/lib/hr/http";
import { MOCK_ROLES } from "@/lib/hr/mocks";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  if (isMockMode()) return NextResponse.json(MOCK_ROLES);

  const result = await n8nFetch("/hr/roles", { schema: RolesResponseSchema });
  if (!result.ok) return jsonError("Couldn't load open roles.", result.status);
  return NextResponse.json(result.data);
}
