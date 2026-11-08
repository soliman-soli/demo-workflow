"use client";

import { AlertTriangle, Calendar, ExternalLink, Mail, RefreshCw, XCircle } from "lucide-react";
import { Drawer } from "@/components/ui/dialog";
import { Badge, ScoreBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Candidate } from "@/lib/hr/schemas";

export function CandidateDrawer({
  candidate,
  open,
  onOpenChange,
  onOpenInvite,
  onOpenReject,
  actionBusy,
}: {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenInvite: (candidate: Candidate) => void;
  onOpenReject: (candidate: Candidate) => void;
  actionBusy: boolean;
}) {
  if (!candidate) return null;

  const isInvited = candidate.status === "interview_invited";
  const isRejected =
    candidate.status === "rejected" || candidate.status === "rejected_by_hr";
  const isAutoRejected = candidate.status === "rejected";

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={candidate.name}
      description={candidate.role}
      footer={
        <div className="space-y-2">
          {isInvited && (
            <p className="text-xs text-muted">
              Already invited{candidate.interview_at ? ` for ${candidate.interview_at}` : ""}. Primary actions are locked, or you can resend the invite with updated details.
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {!isInvited ? (
                <Button
                  size="sm"
                  onClick={() => onOpenInvite(candidate)}
                  disabled={actionBusy}
                >
                  <Calendar className="h-3.5 w-3.5" aria-hidden /> Send interview invite
                </Button>
              ) : (
                <>
                  <Button size="sm" disabled title="Interview invite has already been sent">
                    Interview invited
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenInvite(candidate)}
                    disabled={actionBusy}
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Resend invite
                  </Button>
                </>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenReject(candidate)}
                disabled={isInvited || isRejected || actionBusy}
                title={
                  isInvited
                    ? "Cannot reject after sending an interview invite"
                    : isRejected
                    ? "Candidate is already rejected"
                    : undefined
                }
              >
                <XCircle className="h-3.5 w-3.5 text-danger" aria-hidden /> Reject
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 text-sm">
        {/* Top metadata */}
        <div className="flex flex-wrap items-center gap-2">
          <ScoreBadge score={candidate.score} />
          <Badge tone="neutral">{candidate.fit_label}</Badge>
          <StatusBadge status={candidate.status} />
        </div>

        {/* Contact links */}
        <div className="flex flex-wrap gap-4 rounded-[var(--radius-btn)] border border-border bg-surface-2/50 px-4 py-3 text-xs">
          <a
            href={`mailto:${candidate.email}`}
            className="inline-flex items-center gap-1.5 font-medium text-text hover:text-accent"
          >
            <Mail className="h-3.5 w-3.5 text-muted" aria-hidden />
            {candidate.email}
          </a>
          {candidate.linkedin && (
            <a
              href={
                candidate.linkedin.startsWith("http")
                  ? candidate.linkedin
                  : `https://${candidate.linkedin}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
            >
              LinkedIn profile <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          )}
        </div>

        {candidate.interview_at && (
          <div className="rounded-[var(--radius-btn)] border border-info/30 bg-info/10 px-4 py-2.5 text-xs text-info-text">
            <strong className="font-semibold">Scheduled interview:</strong> {candidate.interview_at}
          </div>
        )}

        {/* AI Summary */}
        <section>
          <h3 className="label-caps">AI screening summary</h3>
          <p className="mt-2 leading-relaxed text-muted">{candidate.summary}</p>
        </section>

        {/* Recommendation */}
        <section className="rounded-[var(--radius-btn)] border border-border bg-surface-2/40 p-3.5">
          <p className="label-caps">Recommendation</p>
          <p className="mt-1 font-medium text-text">{candidate.recommendation}</p>
          {candidate.auto_email && (
            <p className="mt-1 text-xs text-muted">{candidate.auto_email}</p>
          )}
        </section>

        {/* Red flags (only if any) */}
        {candidate.red_flags.length > 0 && (
          <section className="rounded-[var(--radius-btn)] border border-danger/30 bg-danger/10 p-4">
            <div className="flex items-center gap-2 text-danger-text">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              <h3 className="text-xs font-semibold uppercase tracking-wider">Red flags</h3>
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-danger-text">
              {candidate.red_flags.map((flag, i) => (
                <li key={i}>{flag}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Strengths & Gaps */}
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-[var(--radius-btn)] border border-border p-4">
            <h3 className="label-caps">Strengths</h3>
            {candidate.strengths.length > 0 ? (
              <ul className="mt-2.5 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-muted">
                {candidate.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted">None highlighted.</p>
            )}
          </section>

          <section className="rounded-[var(--radius-btn)] border border-border p-4">
            <h3 className="label-caps">Gaps</h3>
            {candidate.gaps.length > 0 ? (
              <ul className="mt-2.5 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-muted">
                {candidate.gaps.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted">No major gaps noted.</p>
            )}
          </section>
        </div>

        {/* Interview questions */}
        <section>
          <h3 className="label-caps">Suggested interview questions</h3>
          {isAutoRejected ? (
            <p className="mt-2 rounded-[var(--radius-btn)] border border-border bg-surface-2/50 px-4 py-3 text-xs text-muted">
              No interview questions are generated for auto-rejected candidates.
            </p>
          ) : candidate.interview_questions.length === 0 ? (
            <p className="mt-2 text-xs text-muted">No interview questions available for this candidate.</p>
          ) : (
            <ol className="mt-2.5 space-y-2.5">
              {candidate.interview_questions.map((q, i) => (
                <li
                  key={i}
                  className="rounded-[var(--radius-btn)] border border-border bg-surface p-3.5"
                >
                  <p className="text-xs font-medium text-text">
                    {i + 1}. {q.question}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    <span className="font-medium text-text">Probes: </span>
                    {q.probes}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </Drawer>
  );
}

