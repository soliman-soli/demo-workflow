"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Download,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { ScoreBadge, StatusBadge, STATUS_LABEL } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SkeletonTable } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/hr/client";
import {
  ActionResponseSchema,
  CandidatesResponseSchema,
  type Candidate,
  type CandidateStats,
} from "@/lib/hr/schemas";
import { cn } from "@/lib/utils";
import { CandidateDrawer } from "./candidate-drawer";
import { InviteModal, type InvitePayload } from "./invite-modal";

type FilterTab = "all" | "review" | "shortlisted" | "rejected" | "interview_invited";
type SortOption = "newest" | "score";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "review", label: "Needs review" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "rejected", label: "Rejected" },
  { key: "interview_invited", label: "Interview invited" },
];

export function formatRelativeDate(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  const diffSec = Math.round((Date.now() - dt.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function computeStats(candidates: Candidate[]): CandidateStats {
  const scores = candidates.map((c) => c.score).filter((s): s is number => s !== null);
  return {
    total: candidates.length,
    review: candidates.filter((c) => c.status === "review").length,
    shortlisted: candidates.filter((c) => c.status === "shortlisted").length,
    rejected: candidates.filter((c) => c.status === "rejected" || c.status === "rejected_by_hr").length,
    interview_invited: candidates.filter((c) => c.status === "interview_invited").length,
    avg_score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
  };
}

export function Dashboard() {
  const { toast } = useToast();

  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [stats, setStats] = useState<CandidateStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters
  const [tab, setTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Drawer & Modals
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inviteTarget, setInviteTarget] = useState<Candidate | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Candidate | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const fetchCandidates = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    setError(null);
    const res = await api("/api/hr/candidates", CandidatesResponseSchema);
    setRefreshing(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    setCandidates(res.data.candidates);
    setStats(res.data.stats);
    setLastUpdated(new Date());
  }, []);

  // Initial load + 30s auto-refresh
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCandidates();
    const interval = setInterval(() => {
      void fetchCandidates(true);
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchCandidates]);

  // Close row menu when clicking outside
  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [openMenuId]);

  const rolesList = useMemo(() => {
    if (!candidates) return [];
    return Array.from(new Set(candidates.map((c) => c.role))).sort();
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    if (!candidates) return [];
    const q = search.trim().toLowerCase();

    const list = candidates.filter((c) => {
      if (tab === "review" && c.status !== "review") return false;
      if (tab === "shortlisted" && c.status !== "shortlisted") return false;
      if (tab === "rejected" && c.status !== "rejected" && c.status !== "rejected_by_hr") {
        return false;
      }
      if (tab === "interview_invited" && c.status !== "interview_invited") return false;
      if (roleFilter !== "all" && c.role !== roleFilter) return false;
      if (q) {
        const hay = `${c.name} ${c.email} ${c.role}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === "score") {
        return (b.score ?? -1) - (a.score ?? -1);
      }
      return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
    });
  }, [candidates, tab, roleFilter, search, sortBy]);

  const selectedCandidate = useMemo(
    () => candidates?.find((c) => c.candidate_id === selectedId) ?? null,
    [candidates, selectedId]
  );

  function applyOptimisticUpdate(
    candidateId: string,
    nextStatus: Candidate["status"],
    interviewAt?: string | null
  ) {
    setCandidates((prev) => {
      if (!prev) return prev;
      const next = prev.map((c) =>
        c.candidate_id === candidateId
          ? {
              ...c,
              status: nextStatus,
              interview_at: interviewAt !== undefined ? interviewAt : c.interview_at,
              updated_at: new Date().toISOString(),
            }
          : c
      );
      setStats(computeStats(next));
      return next;
    });
  }

  async function handleConfirmInvite(payload: InvitePayload) {
    if (!inviteTarget) return;
    const target = inviteTarget;
    setActionBusy(true);

    // Optimistic update
    applyOptimisticUpdate(target.candidate_id, "interview_invited", payload.interview_at);

    const res = await api("/api/hr/action", ActionResponseSchema, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidate_id: target.candidate_id,
        action: "invite_interview",
        ...payload,
      }),
    });
    setActionBusy(false);

    if (!res.ok) {
      toast(res.error, "error");
      void fetchCandidates(true);
      return;
    }

    toast(`Interview invite sent to ${target.name}`, "success");
    setInviteTarget(null);
    void fetchCandidates(true);
  }

  async function handleConfirmReject() {
    if (!rejectTarget) return;
    const target = rejectTarget;
    setActionBusy(true);

    // Optimistic update
    applyOptimisticUpdate(target.candidate_id, "rejected_by_hr");

    const res = await api("/api/hr/action", ActionResponseSchema, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidate_id: target.candidate_id,
        action: "reject",
      }),
    });
    setActionBusy(false);

    if (!res.ok) {
      toast(res.error, "error");
      void fetchCandidates(true);
      return;
    }

    toast(`${target.name} marked as rejected by HR`, "success");
    setRejectTarget(null);
    void fetchCandidates(true);
  }

  function exportCsv() {
    if (!filteredCandidates.length) return;
    const headers = [
      "Candidate ID",
      "Name",
      "Email",
      "Role",
      "Score",
      "Status",
      "Fit Label",
      "Submitted At",
      "Interview At",
      "LinkedIn",
    ];
    const escapeCell = (val: string | number | null | undefined) => {
      const str = val === null || val === undefined ? "" : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };
    const rows = filteredCandidates.map((c) =>
      [
        c.candidate_id,
        c.name,
        c.email,
        c.role,
        c.score ?? "",
        STATUS_LABEL[c.status],
        c.fit_label,
        c.submitted_at,
        c.interview_at ?? "",
        c.linkedin,
      ]
        .map(escapeCell)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `candidates-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      {/* Top header */}
      <div>
        <Link
          href="/projects/hr-system"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-text"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden /> HR Demo
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-medium sm:text-4xl">Recruiter dashboard</h1>
            </div>
            <p className="mt-1 text-xs text-muted" aria-live="polite">
              {lastUpdated
                ? `Last updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · Auto-refreshes every 30s`
                : "Loading candidates…"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchCandidates()}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} aria-hidden />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={!filteredCandidates.length}
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <section aria-label="Pipeline statistics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total applicants" value={stats?.total} />
        <StatCard label="Needs review" value={stats?.review} />
        <StatCard label="Shortlisted" value={stats?.shortlisted} />
        <StatCard label="Rejected" value={stats?.rejected} />
        <StatCard label="Interviews invited" value={stats?.interview_invited} />
        <StatCard
          label="Average score"
          value={stats ? `${stats.avg_score}` : undefined}
          suffix={stats ? "/ 100" : undefined}
        />
      </section>

      {/* Filters bar */}
      <section aria-label="Candidate filters" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Filter by status"
            className="flex flex-wrap gap-1 rounded-[var(--radius-btn)] border border-border bg-surface-2 p-1"
          >
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "rounded-[8px] px-3 py-1.5 text-xs font-medium transition-colors",
                  tab === t.key
                    ? "bg-surface text-text shadow-sm"
                    : "text-muted hover:text-text"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <label htmlFor="cand-search" className="sr-only">
                Search candidates by name, email or role
              </label>
              <Input
                id="cand-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, role…"
                className="h-9 w-56 pl-8 text-xs"
              />
            </div>

            <label htmlFor="cand-role-filter" className="sr-only">
              Filter by role
            </label>
            <select
              id="cand-role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 rounded-[var(--radius-btn)] border border-border bg-surface px-2.5 text-xs focus:border-accent focus:outline-none"
            >
              <option value="all">All roles</option>
              {rolesList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <label htmlFor="cand-sort" className="sr-only">
              Sort candidates
            </label>
            <select
              id="cand-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-9 rounded-[var(--radius-btn)] border border-border bg-surface px-2.5 text-xs focus:border-accent focus:outline-none"
            >
              <option value="newest">Sort: Newest</option>
              <option value="score">Sort: Highest score</option>
            </select>
          </div>
        </div>
      </section>

      {/* Error state */}
      {error && <ErrorState message={error} onRetry={() => void fetchCandidates()} />}

      {/* Table */}
      <section
        aria-label="Candidates list"
        className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface"
      >
        {candidates === null ? (
          <SkeletonTable rows={5} />
        ) : candidates.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No applicants yet"
            body="New applications submitted through the Apply flow will appear here automatically."
          />
        ) : filteredCandidates.length === 0 ? (
          <EmptyState
            title="No candidates match these filters"
            body="Try clearing your search query or switching to the All tab."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTab("all");
                  setSearch("");
                  setRoleFilter("all");
                }}
              >
                Reset filters
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-2/70 text-xs uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Candidate
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Role
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Score
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Applied
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCandidates.map((cand) => {
                  const isInvited = cand.status === "interview_invited";
                  const isRejected =
                    cand.status === "rejected" || cand.status === "rejected_by_hr";
                  const exactDate = new Date(cand.submitted_at).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  });

                  return (
                    <tr
                      key={cand.candidate_id}
                      tabIndex={0}
                      onClick={() => setSelectedId(cand.candidate_id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedId(cand.candidate_id);
                        }
                      }}
                      className="cursor-pointer transition-colors hover:bg-surface-2/50 focus-visible:bg-surface-2/50"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-text">{cand.name}</div>
                        <div className="text-xs text-muted">{cand.email}</div>
                      </td>
                      <td className="px-4 py-3.5 text-muted">{cand.role}</td>
                      <td className="px-4 py-3.5">
                        <ScoreBadge score={cand.score} />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={cand.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted">
                        <time dateTime={cand.submitted_at} title={exactDate}>
                          {formatRelativeDate(cand.submitted_at)}
                        </time>
                      </td>
                      <td
                        className="relative px-4 py-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId((cur) =>
                              cur === cand.candidate_id ? null : cand.candidate_id
                            )
                          }
                          aria-label={`Actions for ${cand.name}`}
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === cand.candidate_id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-text"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {openMenuId === cand.candidate_id && (
                          <div
                            role="menu"
                            className="absolute right-4 top-11 z-30 w-48 rounded-[var(--radius-btn)] border border-border bg-surface py-1 text-left text-xs shadow-lg"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuId(null);
                                setSelectedId(cand.candidate_id);
                              }}
                              className="block w-full px-3 py-2 text-left hover:bg-surface-2"
                            >
                              View screening report
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuId(null);
                                setInviteTarget(cand);
                              }}
                              className="block w-full px-3 py-2 text-left hover:bg-surface-2"
                            >
                              {isInvited ? "Resend interview invite" : "Send interview invite"}
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              disabled={isInvited || isRejected}
                              onClick={() => {
                                setOpenMenuId(null);
                                setRejectTarget(cand);
                              }}
                              className="block w-full px-3 py-2 text-left text-danger-text hover:bg-surface-2 disabled:opacity-40"
                            >
                              Reject candidate
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Detail drawer */}
      <CandidateDrawer
        candidate={selectedCandidate}
        open={!!selectedCandidate}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null);
        }}
        onOpenInvite={(cand) => setInviteTarget(cand)}
        onOpenReject={(cand) => setRejectTarget(cand)}
        actionBusy={actionBusy}
      />

      {/* Invite modal */}
      <InviteModal
        candidate={inviteTarget}
        open={!!inviteTarget}
        onOpenChange={(o) => {
          if (!o) setInviteTarget(null);
        }}
        onConfirm={handleConfirmInvite}
        submitting={actionBusy}
      />

      {/* Reject confirmation dialog */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(o) => {
          if (!o) setRejectTarget(null);
        }}
        title={rejectTarget ? `Reject ${rejectTarget.name}?` : "Reject candidate"}
        description="This will update the candidate's status to Rejected by HR and send a polite rejection email via n8n."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setRejectTarget(null)}
              disabled={actionBusy}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleConfirmReject()}
              disabled={actionBusy}
            >
              {actionBusy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Confirm rejection
            </Button>
          </>
        }
      >
        {rejectTarget && (
          <p className="text-sm text-muted">
            Are you sure you want to reject <strong className="font-medium text-text">{rejectTarget.name}</strong> for{" "}
            <strong className="font-medium text-text">{rejectTarget.role}</strong>?
          </p>
        )}
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | string | undefined;
  suffix?: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <p className="label-caps">{label}</p>
      <p className="mt-2 font-heading text-2xl font-medium tabular-nums">
        {value === undefined ? "—" : value}
        {suffix && <span className="ml-1 font-sans text-xs font-normal text-muted">{suffix}</span>}
      </p>
    </div>
  );
}
