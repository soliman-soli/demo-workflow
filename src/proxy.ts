import { NextResponse } from "next/server";

/**
 * Pass-through proxy. Recruiter dashboard demo is open without a passcode.
 */
export async function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/projects/hr-system/hr/dashboard/:path*"],
};
