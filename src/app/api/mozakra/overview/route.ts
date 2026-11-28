import { NextRequest, NextResponse } from "next/server";
import { tooManyRequests } from "@/lib/hr/http";
import { checkRateLimit } from "@/lib/hr/rate-limit";
import {
  getCachedMozakraOverview,
  setCachedMozakraOverview,
} from "@/lib/mozakra/overview-cache";
import { MozakraOverviewResponseSchema } from "@/lib/mozakra/schemas";
import {
  MOZAKRA_DEFAULT_TIMEOUT_MS,
  mozakraUpstreamFetch,
} from "@/lib/mozakra/upstream";

export const revalidate = 60;
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(request, "mozakraOverview");
  if (!rl.success) {
    return tooManyRequests(
      rl,
      "Too many overview requests. Please wait a minute."
    );
  }

  const cached = getCachedMozakraOverview();
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60",
      },
    });
  }

  const result = await mozakraUpstreamFetch({
    endpoint: "/mozakra/live/overview",
    method: "GET",
    schema: MozakraOverviewResponseSchema,
    timeoutMs: MOZAKRA_DEFAULT_TIMEOUT_MS,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status }
    );
  }

  if (!result.data.ok) {
    const errStatus =
      result.data.status && result.data.status >= 400
        ? result.data.status
        : result.status >= 400
          ? result.status
          : 502;
    return NextResponse.json(
      { ok: false, status: errStatus, error: result.data.error },
      { status: errStatus }
    );
  }

  setCachedMozakraOverview(result.data);

  return NextResponse.json(result.data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60",
    },
  });
}
