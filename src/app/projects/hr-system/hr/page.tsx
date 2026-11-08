import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { HR_COOKIE_NAME, verifySessionToken } from "@/lib/hr/session";
import { LoginGate } from "@/features/hr/components/login-gate";

export const metadata: Metadata = { title: "Recruiter Access · HR Demo" };

export default async function HrGatePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(HR_COOKIE_NAME)?.value;
  if (await verifySessionToken(token)) {
    redirect("/projects/hr-system/hr/dashboard");
  }

  return <LoginGate />;
}

