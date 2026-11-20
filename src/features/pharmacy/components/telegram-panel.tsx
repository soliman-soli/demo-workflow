"use client";

import { Check, Loader2, ShieldAlert, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import type { TelegramCard } from "@/lib/pharmacy/schemas";
import { cn } from "@/lib/utils";

interface TelegramPanelProps {
  cards: TelegramCard[];
  blockedMessages: Record<string, string>;
  loadingState: boolean;
  busyRequestId: string | null;
  error: string | null;
  onRetryLoad: () => void;
  onDecision: (action: "approve" | "reject", requestId: string) => void;
}

function formatCardTime(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function TelegramPanel({
  cards,
  blockedMessages,
  loadingState,
  busyRequestId,
  error,
  onRetryLoad,
  onDecision,
}: TelegramPanelProps) {
  return (
    <section
      aria-label="Telegram Dawaa Pharmacists group"
      className="flex h-[560px] flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-[#0e1621] text-[#f5f5f5]"
    >
      {/* Telegram Group Header */}
      <div className="flex items-center gap-3 border-b border-[#1c2938] bg-[#17212b] px-4 py-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2b5278] font-heading text-sm font-semibold text-[#7eb8e8]"
          aria-hidden
        >
          DP
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-sans text-sm font-semibold text-[#f5f5f5]">
            Dawaa Pharmacists
          </h3>
          <p className="truncate text-[11px] text-[#7f91a4]">
            Dawaa Bot · prescription & stock approvals
          </p>
        </div>
      </div>

      {/* Cards Stream */}
      <div
        role="region"
        aria-live="polite"
        aria-label="Pharmacist approval cards"
        className="flex-1 overflow-y-auto px-3 py-4"
      >
        {loadingState ? (
          <div className="space-y-3 p-1">
            <Skeleton className="h-36 w-full bg-[#182533]" />
            <Skeleton className="h-28 w-full bg-[#182533]" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={onRetryLoad} />
        ) : cards.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <ShieldAlert className="h-6 w-6 text-[#6fa2d6]" aria-hidden />
            <p className="font-heading text-lg text-[#f5f5f5]">
              No pharmacist alerts yet
            </p>
            <p className="max-w-xs text-xs leading-relaxed text-[#90a4b8]">
              Non-Rx in-stock orders reserve automatically. Upload a prescription photo or request Augmentin 1g to route a card here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {cards.map((card) => {
              const isPending = card.status === "pending";
              const isBusy = busyRequestId === card.request_id;
              const blockError = blockedMessages[card.request_id];

              return (
                <div key={card.id} className="space-y-2">
                  {/* Dawaa Bot Card */}
                  <article className="rounded-xl border border-[#243447] bg-[#182533] p-3.5 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#6ab2f2]">
                        Dawaa Bot
                      </span>
                      <span className="font-mono text-[11px] text-[#90a4b8]">
                        {card.request_id} · {formatCardTime(card.created_at)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-[#dce5ef]">
                        Customer:{" "}
                        <strong className="font-medium text-white">
                          {card.customer}
                        </strong>
                      </span>
                      <Badge
                        tone={card.is_prescription ? "info" : "neutral"}
                        className="text-[10px]"
                      >
                        {card.is_prescription ? "Rx required" : "Check"}
                      </Badge>
                    </div>

                    {/* Requested Lines */}
                    <ul className="mt-3 space-y-2 border-t border-[#243447] pt-2.5">
                      {card.lines.map((line) => (
                        <li
                          key={`${card.id}-${line.line_no}`}
                          className="rounded-lg bg-[#121c27] px-2.5 py-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-[#f5f5f5]">
                              {line.qty} × {line.medicine_name}
                            </span>
                            {line.in_stock ? (
                              <span className="text-[11px] text-[#74c79f]">
                                in stock ({line.stock}) · {line.price_egp} EGP
                              </span>
                            ) : (
                              <span className="font-medium text-[#ec8c84]">
                                out of stock
                              </span>
                            )}
                          </div>

                          {!line.in_stock && line.alternative && (
                            <p className="mt-1 text-[11px] text-[#e3b263]">
                              Suggested alternative:{" "}
                              <strong className="font-medium">
                                {line.alternative.name}{" "}
                                {line.alternative.strength} (
                                {line.alternative.id})
                              </strong>{" "}
                              · {line.alternative.price_egp} EGP
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>

                    {/* Inline blocked approval error (Rule 3) */}
                    {blockError && isPending && (
                      <p
                        role="alert"
                        className="mt-2.5 rounded-lg border border-danger/40 bg-danger/15 px-2.5 py-1.5 text-[11px] text-[#ec8c84]"
                      >
                        {blockError}
                      </p>
                    )}

                    {/* Action buttons or decided state */}
                    {isPending ? (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => onDecision("approve", card.request_id)}
                          className="h-8 bg-[#1f6f5c] text-xs text-white hover:bg-[#278971]"
                        >
                          {isBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                          ) : (
                            <Check className="h-3.5 w-3.5" aria-hidden />
                          )}
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => onDecision("reject", card.request_id)}
                          className="h-8 border-[#5b3438] bg-[#2a1b1f] text-xs text-[#f2a6a0] hover:bg-[#3a2227] hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-3 border-t border-[#243447] pt-2 text-xs text-[#9eb1c4]">
                        {card.status === "approved"
                          ? card.decision_note || `Approved by ${card.decided_by || "pharmacist_hala"}`
                          : card.decision_note || "Rejected"}
                      </div>
                    )}
                  </article>

                  {/* Centered decision pill after Pharmacist clicks Approve/Reject */}
                  {!isPending && (
                    <div className="flex justify-center">
                      <span
                        className={cn(
                          "rounded-full px-3 py-0.5 text-[11px] font-medium",
                          card.status === "approved"
                            ? "bg-[#2f7d5b]/25 text-[#74c79f] ring-1 ring-[#2f7d5b]/40"
                            : "bg-[#b4443c]/25 text-[#ec8c84] ring-1 ring-[#b4443c]/40"
                        )}
                      >
                        {card.status === "approved" ? "Approved" : "Rejected"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
