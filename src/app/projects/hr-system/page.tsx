import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, LockKeyhole } from "lucide-react";
import { HealthPill } from "@/components/health-pill";
import { Tag } from "@/components/ui/badge";
import { Notice } from "@/components/ui/states";

export const metadata: Metadata = {
  title: "HR Demo",
  description: "AI-powered HR for candidates and recruiters, built with n8n, Gemini, Google Sheets and Next.js.",
};

const demos = [
  {
    n: 1,
    label: "Ask",
    title: "Ask HR a question",
    body: "Leave, remote work, expenses, working hours. Every answer names the policy it comes from.",
    cta: "Start chatting",
    href: "/projects/hr-system/ask",
  },
  {
    n: 2,
    label: "Prepare",
    title: "Get coached for a job",
    body: "Your match score, strengths and gaps on screen; a cover letter and interview answers by email.",
    cta: "Get my report",
    href: "/projects/hr-system/coach",
  },
  {
    n: 3,
    label: "Apply",
    title: "Apply for a role",
    body: "Open positions. Upload a PDF CV and hear back by email within 48 hours.",
    cta: "See open roles",
    href: "/projects/hr-system/apply",
  },
];

const rules = [
  { score: "Below 50", outcome: "Auto-rejected with email. Still listed for HR." },
  { score: "50 to 85", outcome: "Shown to HR with a report. HR decides and sends the interview invite." },
  { score: "Above 85", outcome: "Auto \u201Cshortlisted\u201D email. HR sends the interview time." },
];

export default function HrSystemPage() {
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
            HR Demo
          </li>
        </ol>
      </nav>

      {/* Title */}
      <header className="mt-6 grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-medium sm:text-5xl">HR Demo</h1>
            <HealthPill />
          </div>
          <p className="mt-3 text-lg text-muted">AI-powered HR for candidates and recruiters</p>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {["n8n", "Gemini", "Google Sheets", "Next.js", "TypeScript"].map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>
      </header>

      {/* Demo cards */}
      <section className="mt-14" aria-labelledby="demo-title">
        <h2 id="demo-title" className="text-2xl font-medium sm:text-3xl">
          Hello! What would you like to do today?
        </h2>
        <ul className="mt-6 grid gap-5 md:grid-cols-3">
          {demos.map((d) => (
            <li key={d.n}>
              <Link
                href={d.href}
                className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface p-6 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_8px_24px_-12px_rgba(27,31,36,0.18)]"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-2 -top-6 font-heading text-[8rem] leading-none text-text opacity-[0.06] select-none"
                >
                  {d.n}
                </span>
                <span className="label-caps">
                  {d.label} <span className="sr-only">, step {d.n}</span>
                </span>
                <h3 className="mt-3 text-xl font-medium">{d.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{d.body}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                  {d.cta}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/projects/hr-system/hr"
          className="mt-5 flex items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-border px-5 py-4 text-sm text-muted transition-colors hover:border-accent/40 hover:text-text"
        >
          <LockKeyhole className="h-4 w-4 shrink-0" aria-hidden />
          <span className="flex-1">
            <span className="font-medium text-text">For the HR team:</span> recruiter dashboard, screening sheet and system health
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>

        <div className="mt-5">
          <Notice>This is a demo. Don&apos;t upload sensitive documents. Emails are really sent.</Notice>
        </div>
      </section>

      {/* Case study */}
      <article className="mt-20 border-t border-border pt-14" aria-labelledby="case-title">
        <p className="label-caps">Case study</p>
        <h2 id="case-title" className="mt-2 text-3xl font-medium">
          How it&apos;s built
        </h2>

        <div className="mt-10 grid grid-cols-12 gap-x-6 gap-y-12">
          <CaseSection title="The problem">
            <p>
              Small teams run HR out of inboxes and spreadsheets. Employees wait days for answers that sit in a PDF
              handbook. Recruiters skim dozens of CVs by hand, and candidates hear nothing back.
            </p>
            <p>
              I wanted one system that answers policy questions with citations, gives candidates useful feedback, and
              screens applications consistently while leaving the final call to a human.
            </p>
          </CaseSection>

          <CaseSection title="How it works">
            <p>
              The browser only talks to Next.js route handlers. They validate input, check files and rate limits, then
              call n8n webhooks with a secret key. n8n runs the workflows: Gemini reads policies and CVs, Google Sheets
              stores policies and candidates, Gmail sends the emails.
            </p>
            <FlowDiagram />
          </CaseSection>

          <CaseSection title="Screening rules">
            <p>Every application gets a 0 to 100 match score. The score decides what happens automatically:</p>
            <div className="mt-4 overflow-hidden rounded-[var(--radius-btn)] border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs uppercase tracking-[0.08em] text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Score</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {rules.map((r) => (
                    <tr key={r.score}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium">{r.score}</td>
                      <td className="px-4 py-3 text-muted">{r.outcome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CaseSection>

          <CaseSection title="Tech decisions">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="font-medium text-text">n8n as the backend.</strong> Workflows are visible, easy to change,
                and retries and email come built in.
              </li>
              <li>
                <strong className="font-medium text-text">A thin Next.js proxy.</strong> The n8n URL and key stay on the
                server; zod validates every request and every upstream response.
              </li>
              <li>
                <strong className="font-medium text-text">Google Sheets as storage.</strong> Recruiters can open and audit
                it directly. That&apos;s good enough at demo scale.
              </li>
              <li>
                <strong className="font-medium text-text">Humans make the final call.</strong> The AI never sends an
                interview invite; only HR can.
              </li>
            </ul>
          </CaseSection>

          <CaseSection title="What I'd improve">
            <ul className="list-disc space-y-2 pl-5">
              <li>Move candidates to Postgres with row-level access for multiple recruiters.</li>
              <li>Embed policies in a vector store instead of re-reading whole documents.</li>
              <li>Add an evaluation set to measure screening consistency and bias over time.</li>
              <li>Replace the shared passcode with real accounts and an audit log of HR actions.</li>
            </ul>
          </CaseSection>
        </div>
      </article>
    </>
  );
}

function CaseSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="col-span-12 grid grid-cols-12 gap-6">
      <h3 className="col-span-12 text-xl font-medium md:col-span-4">{title}</h3>
      <div className="col-span-12 space-y-3 text-sm leading-relaxed text-muted md:col-span-8 sm:text-base">{children}</div>
    </section>
  );
}

function FlowDiagram() {
  const box = "rounded-[var(--radius-btn)] border border-border bg-surface px-3 py-2 text-center text-sm font-medium text-text";
  return (
    <figure className="mt-5" aria-label="Request flow: Browser to Next.js to n8n, which calls Gemini, Google Sheets and Gmail">
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <div className={box}>Browser</div>
        <Arrow />
        <div className={box}>
          Next.js <span className="block text-xs font-normal text-muted">/api/hr/*</span>
        </div>
        <Arrow />
        <div className={`${box} border-accent/50`}>
          n8n <span className="block text-xs font-normal text-muted">workflows</span>
        </div>
        <Arrow />
        <div className="flex flex-col gap-1.5">
          {["Gemini", "Google Sheets", "Gmail"].map((s) => (
            <div key={s} className="rounded-md bg-surface-2 px-3 py-1 text-center text-xs text-text">
              {s}
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mt-3 text-xs text-muted">The browser never sees the n8n URL or key.</figcaption>
    </figure>
  );
}

function Arrow() {
  return (
    <span aria-hidden className="self-center text-muted">
      <span className="hidden sm:inline">→</span>
      <span className="sm:hidden">↓</span>
    </span>
  );
}

