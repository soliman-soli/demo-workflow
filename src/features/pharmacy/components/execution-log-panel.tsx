"use client";

import { Activity } from "lucide-react";
import { Badge, type Tone } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import type { ExecutionRun } from "@/lib/pharmacy/schemas";
import { cn } from "@/lib/utils";

interface ExecutionLogPanelProps {
  execution: ExecutionRun | null;
  visibleCount: number;
  streaming: boolean;
  loadingState: boolean;
  error: string | null;
  onRetryLoad: () => void;
}

function badgeForStatus(
  status: ExecutionRun["status"] | "idle",
  streaming: boolean
): { label: string; tone: Tone } {
  if (streaming || status === "running") {
    return { label: "running", tone: "warning" };
  }
  if (status === "succeeded") return { label: "succeeded", tone: "success" };
  if (status === "failed") return { label: "failed", tone: "danger" };
  return { label: "idle", tone: "neutral" };
}

export function ExecutionLogPanel({
  execution,
  visibleCount,
  streaming,
  loadingState,
  error,
  onRetryLoad,
}: ExecutionLogPanelProps) {
  const status = badgeForStatus(execution?.status ?? "idle", streaming);
  const shownSteps = execution ? execution.steps.slice(0, visibleCount) : [];

  return (
    <section
      aria-label="n8n workflow execution log"
      className="flex h-[560px] flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3.5">
        <div className="min-w-0">
          <h3 className="font-sans text-sm font-semibold text-text">
            Execution log
          </h3>
          <p className="truncate text-[11px] text-muted">
            {execution
              ? `${execution.workflow} · ${shownSteps.length}/${execution.steps.length} nodes`
              : "Waiting for customer message"}
          </p>
        </div>
        <Badge tone={status.tone}>
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              status.tone === "success" && "bg-success",
              status.tone === "warning" && "bg-warning animate-pulse",
              status.tone === "danger" && "bg-danger",
              status.tone === "neutral" && "bg-muted"
            )}
            aria-hidden
          />
          {status.label}
        </Badge>
      </div>

      {/* Live Stream Steps */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Workflow node execution steps"
        className="flex-1 overflow-y-auto px-4 py-3"
      >
        {loadingState ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                <Skeleton className="h-3.5 w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={onRetryLoad} />
        ) : !execution || execution.steps.length === 0 ? (
          <EmptyState
            icon={<Activity className="h-6 w-6" />}
            title="No runs yet"
            body="Send a message or click a quick-reply chip on the left to watch n8n execute step by step."
          />
        ) : (
          <ol className="space-y-2.5">
            {shownSteps.map((s) => (
              <li
                key={s.id}
                className="animate-fade flex items-start gap-2.5 rounded-lg border border-border/60 bg-bg/50 px-3 py-2 text-xs leading-snug"
              >
                <span
                  className={cn(
                    "mt-1 h-2 w-2 shrink-0 rounded-full",
                    s.status === "ok" && "bg-success",
                    s.status === "warn" && "bg-warning",
                    s.status === "error" && "bg-danger"
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1 break-words">
                  <span className="font-mono font-semibold text-text">
                    {s.name}
                  </span>{" "}
                  <span className="text-muted">·</span>{" "}
                  <span className="text-muted">{s.detail}</span>
                </div>
              </li>
            ))}
            {streaming && execution && visibleCount < execution.steps.length && (
              <li className="flex items-center gap-2 px-3 py-1 text-xs text-muted">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" aria-hidden />
                <span>Executing next node…</span>
              </li>
            )}
          </ol>
        )}
      </div>
    </section>
  );
}
