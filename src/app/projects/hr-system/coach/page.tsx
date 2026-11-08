import type { Metadata } from "next";
import { DemoPageHeader } from "@/components/demo-page-header";
import { CoachFlow } from "@/features/coach/components/coach-flow";

export const metadata: Metadata = { title: "Career Coach · HR Demo" };

export default function CoachPage() {
  return (
    <>
      <DemoPageHeader
        label="Prepare · 2"
        title="Get coached for a job"
        description="Upload your CV to see your match score, strengths, gaps and likely interview questions. A tailored cover letter and sample answers arrive by email."
      />
      <CoachFlow />
    </>
  );
}
