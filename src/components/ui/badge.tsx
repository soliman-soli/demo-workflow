import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { CandidateStatus } from "@/lib/hr/schemas";

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted border-border",
  accent: "bg-accent/10 text-accent border-accent/25",
  success: "bg-success/12 text-success-text border-success/25",
  warning: "bg-warning/12 text-warning-text border-warning/30",
  danger: "bg-danger/12 text-danger-text border-danger/25",
  info: "bg-info/12 text-info-text border-info/25",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

export function scoreTone(score: number | null): Tone {
  if (score === null) return "neutral";
  if (score < 50) return "danger";
  if (score <= 85) return "warning";
  return "success";
}

export function ScoreBadge({ score, className }: { score: number | null; className?: string }) {
  return (
    <Badge tone={scoreTone(score)} className={cn("tabular-nums", className)} aria-label={score === null ? "No score" : `Score ${score} of 100`}>
      {score === null ? "—" : score}
    </Badge>
  );
}

export const STATUS_LABEL: Record<CandidateStatus, string> = {
  review: "Needs review",
  shortlisted: "Shortlisted",
  rejected: "Auto-rejected",
  rejected_by_hr: "Rejected by HR",
  interview_invited: "Interview invited",
};

const STATUS_TONE: Record<CandidateStatus, Tone> = {
  review: "warning",
  shortlisted: "success",
  rejected: "danger",
  rejected_by_hr: "danger",
  interview_invited: "info",
};

export function StatusBadge({ status }: { status: CandidateStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
      {children}
    </span>
  );
}

