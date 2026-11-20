"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/hr/client";
import { useToast } from "@/components/ui/toast";
import {
  PharmacyDecisionResponseSchema,
  PharmacyMessageResponseSchema,
  PharmacyResetResponseSchema,
  PharmacyStateSchema,
  type ExecutionRun,
  type PharmacyState,
} from "@/lib/pharmacy/schemas";
import { createSampleRxFile } from "@/lib/pharmacy/sample-rx";
import { cn } from "@/lib/utils";
import { ExecutionLogPanel } from "./execution-log-panel";
import { SheetViewer } from "./sheet-viewer";
import { TelegramPanel } from "./telegram-panel";
import { WhatsAppPanel } from "./whatsapp-panel";

type MobileTab = "customer" | "log" | "pharmacist";

export function PharmacySimulator() {
  const { toast } = useToast();

  const [state, setState] = useState<PharmacyState | null>(null);
  const [loadingState, setLoadingState] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [busyDecisionId, setBusyDecisionId] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("customer");

  // Streaming execution log state
  const [activeExecution, setActiveExecution] = useState<ExecutionRun | null>(null);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [streaming, setStreaming] = useState(false);

  // Client-only in-memory previews for uploaded Rx images (never persisted)
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  // Inline blocked-approval notices keyed by request_id
  const [blockedMessages, setBlockedMessages] = useState<Record<string, string>>({});

  const pendingPreviewRef = useRef<{ previewUrl: string } | null>(null);
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const attachLatestPreviewIfNeeded = useCallback((nextState: PharmacyState) => {
    const pending = pendingPreviewRef.current;
    if (!pending) return;
    const latestWithImage = [...nextState.messages]
      .reverse()
      .find((m) => m.sender === "customer" && m.image_name);
    if (latestWithImage) {
      setImagePreviews((prev) => ({
        ...prev,
        [latestWithImage.id]: pending.previewUrl,
      }));
      pendingPreviewRef.current = null;
    }
  }, []);

  const streamExecutionSteps = useCallback((execution: ExecutionRun | null) => {
    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }

    if (!execution || execution.steps.length === 0) {
      setActiveExecution(execution);
      setVisibleSteps(0);
      setStreaming(false);
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setActiveExecution(execution);

    if (prefersReducedMotion) {
      setVisibleSteps(execution.steps.length);
      setStreaming(false);
      return;
    }

    setVisibleSteps(1);
    setStreaming(execution.steps.length > 1);

    let current = 1;
    streamTimerRef.current = setInterval(() => {
      current += 1;
      setVisibleSteps(current);
      if (current >= execution.steps.length) {
        if (streamTimerRef.current) {
          clearInterval(streamTimerRef.current);
          streamTimerRef.current = null;
        }
        setStreaming(false);
      }
    }, 180);
  }, []);

  const fetchState = useCallback(async (isInitial = false) => {
    if (isInitial) setLoadError(null);
    const res = await api("/api/pharmacy/state", PharmacyStateSchema);
    if (isInitial) setLoadingState(false);
    if (!res.ok) {
      if (isInitial) setLoadError(res.error);
      return;
    }
    setState(res.data);
  }, []);

  // Initial load without calling setState synchronously inside the effect body
  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await api("/api/pharmacy/state", PharmacyStateSchema);
      if (!active) return;
      setLoadingState(false);
      if (!res.ok) {
        setLoadError(res.error);
        return;
      }
      setState(res.data);
      if (res.data.last_run) {
        setActiveExecution(res.data.last_run);
        setVisibleSteps(res.data.last_run.steps.length);
      }
    })();

    return () => {
      active = false;
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, []);

  // Poll /api/pharmacy/state every 1.5s while the simulation is actively running
  useEffect(() => {
    if (!sending && !busyDecisionId && !streaming) return;
    const interval = setInterval(() => {
      void fetchState(false);
    }, 1500);
    return () => clearInterval(interval);
  }, [sending, busyDecisionId, streaming, fetchState]);

  async function handleSendText(text: string) {
    if (sending) return;
    setSending(true);
    setLoadError(null);

    const res = await api("/api/pharmacy/message", PharmacyMessageResponseSchema, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, customer: "Youssef Adel (Demo)" }),
    });

    setSending(false);
    if (!res.ok) {
      toast(res.error, "error");
      return;
    }

    setState(res.data.state);
    streamExecutionSteps(res.data.execution);
  }

  async function handleSendPhoto(file: File, caption?: string) {
    if (sending) return;
    setSending(true);
    setLoadError(null);

    const objectUrl = URL.createObjectURL(file);
    pendingPreviewRef.current = { previewUrl: objectUrl };

    const fd = new FormData();
    fd.append("image", file, file.name);
    if (caption) fd.append("text", caption);
    fd.append("customer", "Youssef Adel (Demo)");

    const res = await api("/api/pharmacy/message", PharmacyMessageResponseSchema, {
      method: "POST",
      body: fd,
    });

    setSending(false);
    if (!res.ok) {
      pendingPreviewRef.current = null;
      URL.revokeObjectURL(objectUrl);
      toast(res.error, "error");
      return;
    }

    attachLatestPreviewIfNeeded(res.data.state);
    setState(res.data.state);
    streamExecutionSteps(res.data.execution);
  }

  async function handleSendSampleRx() {
    if (sending) return;
    setSending(true);
    setLoadError(null);

    const { file, previewUrl } = await createSampleRxFile();
    pendingPreviewRef.current = { previewUrl };

    const fd = new FormData();
    fd.append("image", file, file.name);
    fd.append("customer", "Youssef Adel (Demo)");

    const res = await api("/api/pharmacy/message", PharmacyMessageResponseSchema, {
      method: "POST",
      body: fd,
    });

    setSending(false);
    if (!res.ok) {
      pendingPreviewRef.current = null;
      toast(res.error, "error");
      return;
    }

    attachLatestPreviewIfNeeded(res.data.state);
    setState(res.data.state);
    streamExecutionSteps(res.data.execution);
  }

  async function handleDecision(action: "approve" | "reject", requestId: string) {
    if (busyDecisionId) return;
    setBusyDecisionId(requestId);

    const res = await api("/api/pharmacy/decision", PharmacyDecisionResponseSchema, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_data: `ph:${action}:${requestId}`,
        pharmacist: "pharmacist_hala",
      }),
    });

    setBusyDecisionId(null);
    if (!res.ok) {
      toast(res.error, "error");
      return;
    }

    setState(res.data.state);
    streamExecutionSteps(res.data.execution);

    if (!res.data.decision_ok) {
      setBlockedMessages((prev) => ({ ...prev, [requestId]: res.data.toast }));
      toast(res.data.toast, "error");
    } else {
      setBlockedMessages((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
      toast(res.data.toast, "success");
    }
  }

  async function handleResetDemo() {
    if (resetting) return;
    setResetting(true);

    const res = await api("/api/pharmacy/reset", PharmacyResetResponseSchema, {
      method: "POST",
    });

    setResetting(false);
    if (!res.ok) {
      toast(res.error, "error");
      return;
    }

    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    setActiveExecution(null);
    setVisibleSteps(0);
    setStreaming(false);
    setBlockedMessages({});
    setImagePreviews({});
    setState(res.data.state);
    toast("Demo reset: stock restored and reservations cleared.", "success");
  }

  const pendingCardsCount =
    state?.telegram_cards.filter((c) => c.status === "pending").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Mobile-only simulator view switcher */}
      <div className="lg:hidden">
        <div
          role="tablist"
          aria-label="Simulator views"
          className="grid grid-cols-3 gap-1 rounded-[var(--radius-btn)] border border-border bg-surface-2 p-1"
        >
          {(
            [
              { key: "customer", label: "Customer" },
              {
                key: "log",
                label: streaming ? "Log ●" : "Log",
              },
              {
                key: "pharmacist",
                label:
                  pendingCardsCount > 0
                    ? `Pharmacist (${pendingCardsCount})`
                    : "Pharmacist",
              },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={mobileTab === t.key}
              onClick={() => setMobileTab(t.key)}
              className={cn(
                "rounded-[8px] px-2.5 py-2 text-xs font-medium transition-colors",
                mobileTab === t.key
                  ? "bg-surface text-text shadow-sm"
                  : "text-muted hover:text-text"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Column Simulator (Desktop grid / Mobile tabbed stack) */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className={cn(mobileTab !== "customer" && "hidden lg:block")}>
          <WhatsAppPanel
            messages={state?.messages ?? []}
            previews={imagePreviews}
            loadingState={loadingState}
            sending={sending}
            error={loadError}
            onRetryLoad={() => void fetchState(true)}
            onSendText={(txt) => void handleSendText(txt)}
            onSendPhoto={(file, caption) => void handleSendPhoto(file, caption)}
            onSendSampleRx={() => void handleSendSampleRx()}
          />
        </div>

        <div className={cn(mobileTab !== "log" && "hidden lg:block")}>
          <ExecutionLogPanel
            execution={activeExecution}
            visibleCount={visibleSteps}
            streaming={streaming || sending || Boolean(busyDecisionId)}
            loadingState={loadingState}
            error={loadError}
            onRetryLoad={() => void fetchState(true)}
          />
        </div>

        <div className={cn(mobileTab !== "pharmacist" && "hidden lg:block")}>
          <TelegramPanel
            cards={state?.telegram_cards ?? []}
            blockedMessages={blockedMessages}
            loadingState={loadingState}
            busyRequestId={busyDecisionId}
            error={loadError}
            onRetryLoad={() => void fetchState(true)}
            onDecision={(action, requestId) => void handleDecision(action, requestId)}
          />
        </div>
      </div>

      {/* Below: Read-only Google Sheet viewer */}
      <SheetViewer
        catalog={state?.catalog ?? []}
        reservations={state?.reservations ?? []}
        errors={state?.errors ?? []}
        loadingState={loadingState}
        resetting={resetting}
        loadError={loadError}
        onRetryLoad={() => void fetchState(true)}
        onResetDemo={() => void handleResetDemo()}
      />
    </div>
  );
}
