"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import {
  MozakraOverviewResponseSchema,
  type MozakraOverviewSuccess,
} from "@/lib/mozakra/schemas";
import { cn } from "@/lib/utils";

const BOX_KEYS = ["1", "2", "3", "4"] as const;

function formatUpdatedAt(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MozakraTeacherOverview() {
  const [data, setData] = useState<MozakraOverviewSuccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mozakra/overview", { cache: "no-store" });
      let json: unknown = null;
      try {
        json = await res.json();
      } catch {
        /* handled below */
      }
      const parsed = MozakraOverviewResponseSchema.safeParse(json);
      if (!parsed.success || !parsed.data.ok) {
        setError(
          parsed.success && !parsed.data.ok
            ? parsed.data.error
            : "The live demo backend is offline right now."
        );
        setLoading(false);
        return;
      }
      setData(parsed.data);
    } catch {
      setError("The live demo backend is offline right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/mozakra/overview", { cache: "no-store" });
        let json: unknown = null;
        try {
          json = await res.json();
        } catch {
          /* handled below */
        }
        if (!active) return;
        const parsed = MozakraOverviewResponseSchema.safeParse(json);
        if (!parsed.success || !parsed.data.ok) {
          setError(
            parsed.success && !parsed.data.ok
              ? parsed.data.error
              : "The live demo backend is offline right now."
          );
          setLoading(false);
          return;
        }
        setData(parsed.data);
      } catch {
        if (!active) return;
        setError("The live demo backend is offline right now.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const totalBoxCards = data
    ? BOX_KEYS.reduce((sum, k) => sum + (data.boxDistribution[k] ?? 0), 0)
    : 0;

  return (
    <div className="space-y-5 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" aria-hidden />
            <h3 className="font-sans text-sm font-semibold text-text">
              Live from the Google Sheet behind this demo
            </h3>
            <Badge tone="neutral">Cached 60s</Badge>
          </div>
          {data?.updatedAt && (
            <p className="mt-1 text-xs text-muted">
              Updated at {formatUpdatedAt(data.updatedAt)}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void loadOverview()}
          disabled={loading}
        >
          <RotateCw
            className={cn("h-3.5 w-3.5", loading && "animate-spin")}
            aria-hidden
          />
          Refresh
        </Button>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="space-y-2 rounded-[var(--radius-btn)] border border-border bg-bg/40 p-3.5"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => void loadOverview()} />
      ) : !data ? null : (
        <div className="space-y-6">
          {/* Top Aggregate Metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <MetricTile label="Lectures" value={data.lectures} />
            <MetricTile label="Questions in bank" value={data.questionsInBank} />
            <MetricTile
              label="Quizzes"
              value={`${data.quizzesCompleted}/${data.quizzesSent}`}
              note={`${Math.round(data.completionRate)}% completed`}
            />
            <MetricTile
              label="Average score"
              value={`${Math.round(data.averageScore)}%`}
            />
            <MetricTile label="Sessions" value={data.sessions} />
            <MetricTile
              label="Errors (7d)"
              value={data.errorsLast7Days}
              tone={data.errorsLast7Days > 0 ? "danger" : "normal"}
            />
          </div>

          {/* Box Distribution Bar Chart */}
          <div className="rounded-[var(--radius-btn)] border border-border bg-bg/40 p-4">
            <p className="label-caps">Box distribution</p>
            <div className="mt-3 space-y-2.5">
              {BOX_KEYS.map((k) => {
                const count = data.boxDistribution[k] ?? 0;
                const pct =
                  totalBoxCards > 0 ? Math.round((count / totalBoxCards) * 100) : 0;
                return (
                  <div key={k} className="grid grid-cols-12 items-center gap-3 text-xs">
                    <span className="col-span-2 font-mono font-medium text-text">
                      Box {k}
                    </span>
                    <div className="col-span-8 h-2 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-accent transition-[width] duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="col-span-2 text-right font-mono tabular-nums text-muted">
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weakest Topics + Hardest Questions */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[var(--radius-btn)] border border-border bg-bg/40 p-4">
              <p className="label-caps">Weakest topics</p>
              {data.weakestTopics.length === 0 ? (
                <p className="mt-2 text-xs text-muted">
                  No graded answers recorded yet.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-border text-xs">
                  {data.weakestTopics.map((item) => (
                    <li
                      key={item.topic}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <span className="font-medium text-text">{item.topic}</span>
                      <span className="shrink-0 font-mono tabular-nums text-muted">
                        {Math.round(item.percentCorrect)}% ({item.answers} ans)
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-[var(--radius-btn)] border border-border bg-bg/40 p-4">
              <p className="label-caps">Hardest questions</p>
              {data.hardestQuestions.length === 0 ? (
                <p className="mt-2 text-xs text-muted">
                  No graded questions recorded yet.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-border text-xs">
                  {data.hardestQuestions.map((item, idx) => (
                    <li
                      key={`${idx}-${item.question.slice(0, 20)}`}
                      className="flex items-start justify-between gap-3 py-2"
                    >
                      <span className="line-clamp-2 text-text">
                        {item.question}
                      </span>
                      <span className="shrink-0 font-mono tabular-nums text-muted">
                        {Math.round(item.percentCorrect)}% ({item.answers})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricTile({
  label,
  value,
  note,
  tone = "normal",
}: {
  label: string;
  value: string | number;
  note?: string;
  tone?: "normal" | "danger";
}) {
  return (
    <div className="rounded-[var(--radius-btn)] border border-border bg-bg/40 p-3.5">
      <p className="label-caps">{label}</p>
      <p
        className={cn(
          "mt-1.5 font-heading text-xl font-medium tabular-nums",
          tone === "danger" ? "text-danger-text" : "text-text"
        )}
      >
        {value}
      </p>
      {note && <p className="mt-0.5 text-[11px] text-muted">{note}</p>}
    </div>
  );
}
