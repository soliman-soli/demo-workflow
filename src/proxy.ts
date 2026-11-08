import { NextResponse, type NextRequest } from "next/server";
import { HR_COOKIE_NAME, verifySessionToken } from "@/lib/hr/session";

const GATE = "/projects/hr-system/hr";

/**
 * Optimistic gate for the recruiter dashboard pages. The API routes
 * (candidates, action) verify the cookie again on their own.
 */
export async function proxy(request: NextRequest) {
  const valid = await verifySessionToken(request.cookies.get(HR_COOKIE_NAME)?.value);
  if (!valid) {
    return NextResponse.redirect(new URL(GATE, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/projects/hr-system/hr/dashboard/:path*"],
};
