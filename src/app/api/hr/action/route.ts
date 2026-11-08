import { NextRequest, NextResponse } from "next/server";
import { n8nFetch, isMockMode } from "@/lib/hr/n8n-fetch";
import { ActionRequestSchema, ActionResponseSchema } from "@/lib/hr/schemas";
import { unauthorized, verifyRequestSession } from "@/lib/hr/auth";
import { jsonError, sleep } from "@/lib/hr/http";
import { mockApplyAction } from "@/lib/hr/mocks";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!(await verifyRequestSession(request))) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const parsed = ActionRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid action.", 400);
  if (parsed.data.action === "invite_interview" && !parsed.data.interview_at) {
    return jsonError("Please choose an interview date and time.", 400);
  }

  if (isMockMode()) {
    await sleep(600);
    const res = mockApplyAction(parsed.data.candidate_id, parsed.data.action, parsed.data.interview_at);
    return res ? NextResponse.json(res) : jsonError("Candidate not found.", 404);
  }

  const result = await n8nFetch("/hr/action", {
    method: "POST",
    body: parsed.data,
    schema: ActionResponseSchema,
  });
  if (!result.ok) return jsonError("Couldn't complete that action. Please try again.", result.status);
  return NextResponse.json(result.data);
}
