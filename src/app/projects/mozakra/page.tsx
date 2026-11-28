import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Tag } from "@/components/ui/badge";
import { MozakraLiveDemo } from "@/features/mozakra/components/mozakra-live-demo";
import { MozakraTeacherOverview } from "@/features/mozakra/components/mozakra-teacher-overview";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  title: "Mozakra · AI Study Coach",
  description:
    "Paste a lecture or upload a PDF: Gemini writes the quiz, code validates every question, and spaced repetition decides when each one comes back.",
  openGraph: {
    title: `Mozakra · AI Study Coach · ${siteConfig.name}`,
    description:
      "End-to-end n8n lecture study pack generator and Leitner spaced-repetition quiz platform backed by Gemini and Google Sheets.",
    url: `${siteConfig.url}/projects/mozakra`,
    siteName: siteConfig.name,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: `Mozakra · AI Study Coach · ${siteConfig.name}`,
    description:
      "End-to-end n8n lecture study pack generator and Leitner spaced-repetition quiz platform backed by Gemini and Google Sheets.",
  },
};

const TAGS = [
  "n8n",
  "Gemini",
  "Google Sheets",
  "Google Drive",
  "Gmail",
  "Google Docs",
] as const;

const PIPELINE_STEPS = [
  { label: "Drive", detail: "lecture dropped" },
  { label: "Gemini", detail: "writes content" },
  { label: "Code", detail: "checks questions" },
  { label: "Docs + Sheets", detail: "study pack" },
  { label: "7:00 Gmail", detail: "daily quiz" },
  { label: "Form", detail: "graded instantly" },
] as const;

const SHEET_TABS = [
  {
    tab: "Students",
    holds: "Student roster, email addresses, and active enrollment flags.",
  },
  {
    tab: "Lectures",
    holds:
      "Drive file IDs, lecture titles, processing status, and generated Google Doc links.",
  },
  {
    tab: "Questions",
    holds:
      "Validated multiple-choice items (prompt, options A–D, answer key, explanation, topic).",
  },
  {
    tab: "Cards",
    holds:
      "Per-student Leitner state: current box (1–4), next review date, and last outcome.",
  },
  {
    tab: "Quizzes",
    holds:
      "Daily quiz instances, secret access tokens, selected question IDs, scores, and completion timestamps.",
  },
  {
    tab: "Settings",
    holds:
      "Course config such as teacher email, daily send hour, and quiz size.",
  },
  {
    tab: "Errors",
    holds:
      "Failure log with timestamp, workflow name, error message, and direct n8n execution link.",
  },
] as const;

const WORKFLOWS = [
  {
    name: "Error handler",
    body: "Shared error workflow attached to every Mozakra flow. Logs each failure with a direct link to the failed run in the Errors tab and emails the teacher.",
  },
  {
    name: "Teacher side",
    body: "Watches Google Drive for a new lecture PDF, runs Gemini and the code validator, writes the study pack to Docs + Sheets, and sends the Friday report.",
  },
  {
    name: "Student side",
    body: "Runs at 7:00 daily to pick 5 prioritized cards per student, emails a single-use tokenized quiz form via Gmail, grades answers, and updates boxes.",
  },
  {
    name: "Portal Live (this demo)",
    body: "Live webhook workflow serving /webhook/mozakra/live/{start,grade,next,state,overview} behind Next.js server routes with httpOnly sessions and x-api-key auth.",
  },
] as const;

export default function MozakraPage() {
  return (
    <>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/#projects" className="hover:text-text">
              Projects
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li aria-current="page" className="text-text">
            Mozakra · AI Study Coach
          </li>
        </ol>
      </nav>

      {/* 1. Hero */}
      <header className="mt-6 grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-9">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
            Mozakra · AI Study Coach
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-muted">
            Paste a lecture or upload a PDF: Gemini writes the quiz, code
            validates every question, and spaced repetition decides when each
            one comes back.
          </p>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {TAGS.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </div>
      </header>

      {/* 2. The problem */}
      <section
        className="mt-14 border-t border-border pt-12"
        aria-labelledby="problem-title"
      >
        <div className="grid grid-cols-12 gap-6">
          <h2
            id="problem-title"
            className="col-span-12 text-2xl font-medium md:col-span-4"
          >
            The problem
          </h2>
          <div className="col-span-12 space-y-3 text-sm leading-relaxed text-muted md:col-span-8 sm:text-base">
            <p>
              Between lectures, students either re-read everything passively or
              don&apos;t review at all until the night before the exam.
            </p>
            <p>
              Teachers can&apos;t see which topics the class actually struggles
              with until exam scores come back, when it&apos;s too late to close
              the gaps.
            </p>
          </div>
        </div>
      </section>

      {/* 3. How it works */}
      <section
        className="mt-14 border-t border-border pt-12"
        aria-labelledby="how-title"
      >
        <p className="label-caps">Pipeline</p>
        <h2 id="how-title" className="mt-2 text-2xl font-medium sm:text-3xl">
          How it works
        </h2>

        <ol className="mt-6 flex flex-col items-stretch gap-2 lg:flex-row lg:items-center">
          {PIPELINE_STEPS.map((step, index) => (
            <li
              key={step.label}
              className="flex flex-1 flex-col items-stretch gap-2 lg:flex-row lg:items-center"
            >
              <div className="flex-1 rounded-[var(--radius-btn)] border border-border bg-surface px-3.5 py-3 text-center">
                <span className="block text-sm font-medium text-text">
                  {step.label}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {step.detail}
                </span>
              </div>
              {index < PIPELINE_STEPS.length - 1 && (
                <span aria-hidden className="self-center text-sm text-muted">
                  <span className="hidden lg:inline">→</span>
                  <span className="lg:hidden">↓</span>
                </span>
              )}
            </li>
          ))}
        </ol>

        <p className="mt-4 text-sm text-muted">
          On the website the same pipeline is triggered by your lecture instead
          of a Drive upload, and the quiz is shown here instead of emailed.
        </p>
      </section>

      {/* 4. LIVE DEMO */}
      <section
        id="live-demo"
        className="mt-14 scroll-mt-20 border-t border-border pt-12"
        aria-labelledby="demo-title"
      >
        <p className="label-caps">Live demo</p>
        <h2 id="demo-title" className="mt-2 text-2xl font-medium sm:text-3xl">
          Run the end-to-end pipeline
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Submit lecture notes or a PDF, take the validated quiz, grade it, and
          skip days forward to watch spaced-repetition cards climb to Box 4.
        </p>
        <div className="mt-6">
          <MozakraLiveDemo />
        </div>
      </section>

      {/* 5. Teacher view (live) */}
      <section
        id="teacher-view"
        className="mt-16 scroll-mt-20 border-t border-border pt-14"
        aria-labelledby="teacher-title"
      >
        <p className="label-caps">Teacher view</p>
        <h2
          id="teacher-title"
          className="mt-2 text-2xl font-medium sm:text-3xl"
        >
          Live class analytics
        </h2>
        <div className="mt-5">
          <MozakraTeacherOverview />
        </div>
      </section>

      {/* 6. Under the hood */}
      <section
        className="mt-16 border-t border-border pt-14"
        aria-labelledby="hood-title"
      >
        <p className="label-caps">Engineering details</p>
        <h2 id="hood-title" className="mt-2 text-2xl font-medium sm:text-3xl">
          Under the hood
        </h2>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <HoodCard title="Question checker (code, not AI)">
            <p>
              Every Gemini output passes through a deterministic code validator:
              4 distinct options, one answer A–D, no repeated questions, and no
              &ldquo;all of the above&rdquo;.
            </p>
          </HoodCard>

          <HoodCard title="Quiz order">
            <p>
              Each student&apos;s daily queue is sorted deterministically: wrong
              answers first, then lower Leitner boxes, then oldest due review
              date.
            </p>
          </HoodCard>

          <HoodCard title="Safe links">
            <p>
              Every quiz gets a 32-hex secret token stored in the Quizzes tab.
              Once submitted, the quiz is locked and cannot be retaken.
            </p>
          </HoodCard>

          <HoodCard title="Reliability">
            <p>
              A shared error workflow logs every failure with a direct link to
              the failed n8n run in the Errors tab and emails the teacher.
            </p>
          </HoodCard>
        </div>

        {/* Data model table */}
        <div className="mt-8">
          <h3 className="text-xl font-medium text-text">Data model</h3>
          <p className="mt-1.5 text-sm text-muted">
            All state lives in one Google Sheet with seven tabs so teachers can
            audit everything directly:
          </p>
          <div className="mt-4 overflow-x-auto rounded-[var(--radius-btn)] border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-xs uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Tab
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    What it holds
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {SHEET_TABS.map((row) => (
                  <tr key={row.tab}>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-accent">
                      {row.tab}
                    </td>
                    <td className="px-4 py-3 text-muted">{row.holds}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 7. Workflows */}
      <section
        className="mt-16 border-t border-border pt-14"
        aria-labelledby="workflows-title"
      >
        <p className="label-caps">n8n architecture</p>
        <h2
          id="workflows-title"
          className="mt-2 text-2xl font-medium sm:text-3xl"
        >
          Workflows
        </h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {WORKFLOWS.map((wf) => (
            <article
              key={wf.name}
              className="rounded-[var(--radius-card)] border border-border bg-surface p-5"
            >
              <h3 className="text-lg font-medium text-text">{wf.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {wf.body}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function HoodCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
      <h3 className="text-lg font-medium text-text">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div>
    </article>
  );
}
