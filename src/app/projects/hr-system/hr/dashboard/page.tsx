import type { Metadata } from "next";
import { Dashboard } from "@/features/hr/components/dashboard";

export const metadata: Metadata = { title: "Recruiter Dashboard · HR Demo" };

export default function HrDashboardPage() {
  return <Dashboard />;
}

