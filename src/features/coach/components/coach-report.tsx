"use client";

import Link from "next/link";
import { ChevronDown, Mail, Printer } from "lucide-react";
import { Badge, scoreTone } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type { CoachReport } from "@/lib/hr/schemas";

export function CoachReportView({
  report,
  role,
  email,
  onReset,
}: {
  report: CoachReport;
  role: string;
  email: string;
  onReset: () => void;
}) {
  const tone = scoreTone(report.match_score);
  const stroke =
    tone === "danger" ? "var(--color-danger)" : tone === "warning" ? "var(--color-warning)" : "var(--color-success)";

  return (
    <div className="space-y-8">
      {/* Email banner */}
      <div
        role="status"
        className="flex items-start gap-3 rounded-[var(--radius-card)] border border-info/30 bg-info/10 px-5 py-4 text-sm text-info-text"
      >
        <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          Your cover letter and sample interview answers are on the way to <strong className="font-semibold">{email}</strong>.
        </p>
      </div>

      {/* Score + summary */}
      <section className="print-card grid gap-6 rounded-[var(--radius-card)] border border-border bg-surface p-6 md:grid-cols-12 md:items-center">
        <div className="flex items-center gap-6 md:col-span-5">
          <ScoreRing score={report.match_score} stroke={stroke} />
          <div>
            <p className="label-caps">Match score</p>
            <p className="mt-1 font-heading text-xl font-medium">{role}</p>
            <p className="mt-1 text-sm text-muted">{report.verdict}</p>
          </div>
        </div>
        <div className="border-t border-border pt-4 text-sm leading-relaxed text-muted md:col-span-7 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          {report.summary}
        </div>
      </section>

      {/* Strengths & Gaps */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="print-card rounded-[var(--radius-card)] border border-border bg-surface p-6" aria-labelledby="strengths-h">
          <div className="flex items-center justify-between">
            <h2 id="strengths-h" className="text-xl font-medium">
              Strengths
            </h2>
            <Badge tone="success">{report.strengths.length}</Badge>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {report.strengths.map((s, i) => (
              <li key={i} className="py-3.5 first:pt-0 last:pb-0">
                <p className="text-sm font-medium">{s.title}</p>
                <p className="mt-1 text-sm text-muted">{s.evidence}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="print-card rounded-[var(--radius-card)] border border-border bg-surface p-6" aria-labelledby="gaps-h">
          <div className="flex items-center justify-between">
            <h2 id="gaps-h" className="text-xl font-medium">
              Gaps
            </h2>
            <Badge tone="warning">{report.gaps.length}</Badge>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {report.gaps.map((g, i) => (
              <li key={i} className="space-y-1.5 py-3.5 text-sm first:pt-0 last:pb-0">
                <p className="font-medium">{g.title}</p>
                <p className="text-muted">
                  <span className="font-medium text-text">Why it matters: </span>
                  {g.why_it_matters}
                </p>
                <p className="text-muted">
                  <span className="font-medium text-text">How to fix: </span>
                  {g.how_to_fix}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Focus next */}
      <section className="print-card rounded-[var(--radius-card)] border border-border bg-surface p-6" aria-labelledby="focus-h">
        <h2 id="focus-h" className="text-xl font-medium">
          Focus next
        </h2>
        <ol className="mt-4 space-y-2.5">
          {report.focus_next.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-2 text-xs font-semibold text-muted">
                {i + 1}
              </span>
              <span className="pt-0.5 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Interview questions */}
      <section className="print-card rounded-[var(--radius-card)] border border-border bg-surface p-6" aria-labelledby="iq-h">
        <h2 id="iq-h" className="text-xl font-medium">
          Questions you&apos;re likely to be asked
        </h2>
        <div className="mt-4 divide-y divide-border">
          {report.interview_questions.map((q, i) => (
            <details key={i} className="group py-3.5 first:pt-0 last:pb-0">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-medium">
                <span className="flex-1">{q.question}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge tone="neutral">{q.type}</Badge>
                  <ChevronDown className="h-4 w-4 text-muted transition-transform duration-150 group-open:rotate-180" aria-hidden />
                </span>
              </summary>
              <p className="mt-2.5 text-sm text-muted">
                <span className="font-medium text-text">Why it&apos;s asked: </span>
                {q.why_asked}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="no-print flex flex-wrap items-center gap-3">
        <Link href="/projects/hr-system/apply" className={buttonVariants({ size: "lg" })}>
          Apply for this role
        </Link>
        <Button variant="outline" size="lg" onClick={onReset}>
          Try another role
        </Button>
        <Button variant="ghost" size="lg" onClick={() => window.print()} className="sm:ml-auto">
          <Printer className="h-4 w-4" aria-hidden /> Print report
        </Button>
      </div>
    </div>
  );
}

function ScoreRing({ score, stroke }: { score: number; stroke: string }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = c - (clamped / 100) * c;

  return (
    <div className="relative h-28 w-28 shrink-0" role="img" aria-label={`Match score ${clamped} out of 100`}>
      <svg viewBox="0 0 100 100" className="-rotate-90 h-full w-full">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-3xl font-semibold tabular-nums">{clamped}</span>
        <span className="text-[11px] text-muted">/ 100</span>
      </div>
    </div>
  );
}
