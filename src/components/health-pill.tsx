"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type State = "checking" | "live" | "offline";

/** Polls /api/hr/health every 60s and shows "Live · n8n" or "Offline". */
export function HealthPill({ className }: { className?: string }) {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const res = await fetch("/api/hr/health", { cache: "no-store" });
        const data: unknown = res.ok ? await res.json() : null;
        const live = typeof data === "object" && data !== null && (data as { status?: string }).status === "live";
        if (active) setState(live ? "live" : "offline");
      } catch {
        if (active) setState("offline");
      }
    };
    check();
    const id = setInterval(check, 60_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const label = state === "live" ? "Live · n8n" : state === "offline" ? "Offline" : "Checking…";

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium",
        state === "live" ? "border-success/30 bg-success/10 text-success-text" : "border-border bg-surface-2 text-muted",
        className
      )}
    >
      <span
        aria-hidden
        className={cn("h-2 w-2 rounded-full", state === "live" ? "bg-success" : "bg-muted/60")}
      />
      {label}
    </span>
  );
}
