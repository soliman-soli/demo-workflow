"use client";

import { useState } from "react";
import { AlertTriangle, FileSpreadsheet, RotateCcw } from "lucide-react";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkeletonTable } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import type {
  CatalogItem,
  ErrorLogEntry,
  ReservationLine,
  ReservationStatus,
} from "@/lib/pharmacy/schemas";
import { cn } from "@/lib/utils";

type SheetTab = "catalog" | "reservations" | "errors";

interface SheetViewerProps {
  catalog: CatalogItem[];
  reservations: ReservationLine[];
  errors: ErrorLogEntry[];
  loadingState: boolean;
  resetting: boolean;
  loadError: string | null;
  onRetryLoad: () => void;
  onResetDemo: () => void;
}

const RESERVATION_TONES: Record<ReservationStatus, Tone> = {
  pending: "warning",
  reserved: "success",
  rejected: "danger",
  expired: "neutral",
};

function formatIsoShort(iso: string): string {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function SheetViewer({
  catalog,
  reservations,
  errors,
  loadingState,
  resetting,
  loadError,
  onRetryLoad,
  onResetDemo,
}: SheetViewerProps) {
  const [tab, setTab] = useState<SheetTab>("catalog");

  const tabs: { key: SheetTab; label: string }[] = [
    { key: "catalog", label: "Catalog" },
    { key: "reservations", label: `Reservations (${reservations.length})` },
    {
      key: "errors",
      label: errors.length > 0 ? `Errors (${errors.length})` : "Errors",
    },
  ];

  return (
    <section
      aria-label="Dawaa Google Sheet read-only viewer"
      className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface"
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet className="h-4 w-4 text-accent" aria-hidden />
          <h3 className="font-sans text-sm font-semibold text-text">
            Dawaa - Google Sheet
          </h3>
          <Badge tone="neutral" className="text-[11px]">
            Read-only
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="tablist"
            aria-label="Google Sheet tabs"
            className="flex flex-wrap gap-1 rounded-[var(--radius-btn)] border border-border bg-surface-2 p-1"
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "rounded-[7px] px-2.5 py-1 text-xs font-medium transition-colors",
                  tab === t.key
                    ? "bg-surface text-text shadow-sm"
                    : "text-muted hover:text-text"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetDemo}
            disabled={resetting}
          >
            <RotateCcw
              className={cn("h-3.5 w-3.5", resetting && "animate-spin")}
              aria-hidden
            />
            Reset demo
          </Button>
        </div>
      </div>

      {/* Table Area */}
      {loadingState ? (
        <SkeletonTable rows={4} />
      ) : loadError ? (
        <div className="p-4">
          <ErrorState message={loadError} onRetry={onRetryLoad} />
        </div>
      ) : tab === "catalog" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-surface-2/70 uppercase tracking-[0.08em] text-muted">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-semibold">id</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">name</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">strength</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">price_egp</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">stock</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">requires_rx</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">alternative_id</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {catalog.map((item) => (
                <tr key={item.id} className="hover:bg-surface-2/40">
                  <td className="px-4 py-2.5 font-semibold text-accent">{item.id}</td>
                  <td className="px-4 py-2.5 font-sans font-medium text-text">{item.name}</td>
                  <td className="px-4 py-2.5 text-muted">{item.strength}</td>
                  <td className="px-4 py-2.5 tabular-nums text-text">{item.price_egp}</td>
                  <td className="px-4 py-2.5 tabular-nums">
                    <Badge tone={item.stock === 0 ? "danger" : item.stock <= 3 ? "warning" : "success"}>
                      {item.stock}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={item.requires_rx ? "info" : "neutral"}>
                      {item.requires_rx ? "true" : "false"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted">
                    {item.alternative_id ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === "reservations" ? (
        reservations.length === 0 ? (
          <EmptyState
            title="No reservation lines yet"
            body="Each medicine ordered becomes its own row here with status pending, reserved, rejected, or expired."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface-2/70 uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-semibold">request_id</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">line_no</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">customer</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">medicine_id</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">qty</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">status</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">created_at</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">expires_at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {reservations.map((row) => (
                  <tr key={`${row.request_id}-${row.line_no}`} className="hover:bg-surface-2/40">
                    <td className="px-4 py-2.5 font-semibold text-accent">{row.request_id}</td>
                    <td className="px-4 py-2.5 tabular-nums">{row.line_no}</td>
                    <td className="px-4 py-2.5 font-sans text-text">{row.customer}</td>
                    <td className="px-4 py-2.5 font-semibold">{row.medicine_id}</td>
                    <td className="px-4 py-2.5 tabular-nums">{row.qty}</td>
                    <td className="px-4 py-2.5 font-sans">
                      <Badge tone={RESERVATION_TONES[row.status]}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted">
                      {formatIsoShort(row.created_at)}
                    </td>
                    <td className="px-4 py-2.5 text-muted">
                      {formatIsoShort(row.expires_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : errors.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="h-5 w-5 text-muted" />}
          title="No errors logged"
          body="Unmatched medicine queries or blocked out-of-stock approvals are recorded here."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-surface-2/70 uppercase tracking-[0.08em] text-muted">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-semibold">timestamp</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">workflow</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {errors.map((err, i) => (
                <tr key={`${err.timestamp}-${i}`} className="hover:bg-surface-2/40">
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted">
                    {formatIsoShort(err.timestamp)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-semibold text-warning-text">
                    {err.workflow}
                  </td>
                  <td className="px-4 py-2.5 font-sans text-danger-text">
                    {err.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
