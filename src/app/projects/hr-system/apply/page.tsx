import type { Metadata } from "next";
import { DemoPageHeader } from "@/components/demo-page-header";
import { ApplyFlow } from "@/features/apply/components/apply-flow";

export const metadata: Metadata = { title: "Apply · HR Demo" };

export default function ApplyPage() {
  return (
    <>
      <DemoPageHeader
        label="Apply · 3"
        title="Apply for a role"
        description="Choose an open position and upload your PDF CV. You'll hear back by email within 48 hours."
      />
      <ApplyFlow />
    </>
  );
}

