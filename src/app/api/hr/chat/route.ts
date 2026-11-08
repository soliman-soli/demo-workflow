import { NextRequest, NextResponse } from "next/server";
import { n8nFetch, isMockMode } from "@/lib/hr/n8n-fetch";
import { ChatRequestSchema, ChatResponseSchema } from "@/lib/hr/schemas";
import { checkRateLimit } from "@/lib/hr/rate-limit";
import { jsonError, sleep, tooManyRequests } from "@/lib/hr/http";
import { MOCK_CHAT_NOT_FOUND, MOCK_CHAT_RESPONSE, MOCK_FAIL_TOKEN } from "@/lib/hr/mocks";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, "chat");
  if (!rl.success) return tooManyRequests(rl, "You're sending messages quickly. Please wait a minute.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid request.", 400);
  }

  if (isMockMode()) {
    await sleep(700);
    const lower = parsed.data.message.toLowerCase();
    if (lower.includes(MOCK_FAIL_TOKEN)) return jsonError("The assistant is unavailable right now.", 502);
    if (/(stock|equity|crypto|pet)/.test(lower)) return NextResponse.json(MOCK_CHAT_NOT_FOUND);
    return NextResponse.json(MOCK_CHAT_RESPONSE);
  }

  const result = await n8nFetch("/hr/chat", {
    method: "POST",
    body: parsed.data,
    schema: ChatResponseSchema,
  });
  if (!result.ok) return jsonError("The assistant couldn't answer right now. Please try again.", result.status);
  return NextResponse.json(result.data);
}
