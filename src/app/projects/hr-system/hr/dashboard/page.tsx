import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { HR_COOKIE_NAME, verifySessionToken } from "@/lib/hr/session";
import { Dashboard } from "@/features/hr/components/dashboard";

export const metadata: Metadata = { title: "Recruiter Dashboard · HR Demo" };

export default async function HrDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(HR_COOKIE_NAME)?.value;

  if (!(await verifySessionToken(token))) {
    redirect("/projects/hr-system/hr");
  }

  return <Dashboard />;
}

