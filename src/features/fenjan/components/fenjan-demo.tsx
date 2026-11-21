"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ExternalLink,
  MessageSquare,
  Package,
  RotateCcw,
  RotateCw,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState, Notice } from "@/components/ui/states";
import {
  FenjanChatResponseSchema,
  FenjanSpecialResponseSchema,
  FenjanStatusResponseSchema,
  type FenjanCart,
  type FenjanChatResponse,
  type FenjanSpecialResponse,
  type FenjanStatusResponse,
} from "@/lib/fenjan/schemas";
import { cn } from "@/lib/utils";
import type { ZodType } from "zod";

const SESSION_STORAGE_KEY = "fenjan:sessionId";
const MAX_MESSAGE_CHARS = 1000;
const STATUS_POLL_MS = 5000;
const QUICK_CHIPS = [
  "Show the menu",
  "2 Spanish Latte, delivery",
  "عايز قهوة",
  "I need a human",
] as const;

const KITCHEN_FORM_URL =
  process.env.NEXT_PUBLIC_FENJAN_KITCHEN_FORM_URL?.trim() || "";

interface ChatItem {
  id: string;
  role: "user" | "bot" | "status";
  text: string;
  timestamp: string;
}

interface StaffAlertItem {
  id: string;
  text: string;
  timestamp: string;
}

type FetchOutcome<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number; notConnected?: boolean };

async function fetchFenjanJson<T>(
  url: string,
  schema: ZodType<T>,
  init?: RequestInit
): Promise<FetchOutcome<T>> {
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", ...init });
  } catch {
    return {
      ok: false,
      status: 0,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    /* handled below */
  }

  if (!res.ok) {
    const body = (json ?? {}) as { error?: unknown; notConnected?: unknown };
    const message =
      typeof body.error === "string"
        ? body.error
        : `Request failed (${res.status}). Please try again.`;
    return {
      ok: false,
      status: res.status,
      notConnected: body.notConnected === true || res.status === 503,
      error: message,
    };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      status: res.status,
      error: "Received an unexpected response format from the workflow.",
    };
  }

  return { ok: true, data: parsed.data };
}

function isMostlyArabic(text: string): boolean {
  const arabicCount = (text.match(/[\u0600-\u06FF]/g) ?? []).length;
  if (arabicCount === 0) return false;
  const latinCount = (text.match(/[A-Za-z]/g) ?? []).length;
  return arabicCount >= latinCount;
}

function createSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `fenjan-${crypto.randomUUID().slice(0, 12)}`;
  }
  return `fenjan-${Math.random().toString(36).slice(2, 12)}`;
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTime(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isTerminalStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  const normalized = status.trim().toLowerCase();
  return normalized === "delivered" || normalized === "cancelled";
}

function formatOpenLabel(
  open: boolean,
  openHour: number | string | null | undefined
): string {
  if (open) {
    return openHour !== null && openHour !== undefined && String(openHour).trim()
      ? `Open · ${String(openHour)}`
      : "Open";
  }
  return openHour !== null && openHour !== undefined && String(openHour).trim()
    ? `Closed · ${String(openHour)}`
    : "Closed";
}

export function FenjanDemo() {
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [notConnected, setNotConnected] = useState(false);
  const [mobileTab, setMobileTab] = useState<"chat" | "kitchen" | "side">("chat");
  const [staffAlerts, setStaffAlerts] = useState<StaffAlertItem[]>([]);

  // Latest workflow metadata driven strictly by n8n responses
  const [cart, setCart] = useState<FenjanCart | null>(null);
  const [understood, setUnderstood] = useState<{
    intent: string | null;
    language: string | null;
  } | null>(null);
  const [cafeHours, setCafeHours] = useState<{
    open: boolean;
    openHour: number | string | null;
  } | null>(null);

  // Order tracking state
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<FenjanStatusResponse | null>(
    null
  );
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Daily special state
  const [specialLoading, setSpecialLoading] = useState(true);
  const [specialData, setSpecialData] = useState<FenjanSpecialResponse | null>(
    null
  );
  const [specialError, setSpecialError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const alertsListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastAnnouncedStatusRef = useRef<string | null>(null);

  // Initialize persistent sessionStorage ID on client mount
  useEffect(() => {
    const timer = setTimeout(() => {
      let existing = "";
      try {
        existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY) ?? "";
      } catch {
        existing = "";
      }
      const resolved = /^[\w-]{1,64}$/.test(existing)
        ? existing
        : createSessionId();
      try {
        window.sessionStorage.setItem(SESSION_STORAGE_KEY, resolved);
      } catch {
        /* ignore storage failure in private browsing */
      }
      setSessionId(resolved);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const loadSpecial = useCallback(async () => {
    setSpecialLoading(true);
    setSpecialError(null);
    const res = await fetchFenjanJson(
      "/api/fenjan/special",
      FenjanSpecialResponseSchema
    );
    setSpecialLoading(false);

    if (!res.ok) {
      if (res.notConnected) setNotConnected(true);
      setSpecialError(res.error);
      return;
    }

    setSpecialData(res.data);
  }, []);

  // Load daily special once on page load
  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await fetchFenjanJson(
        "/api/fenjan/special",
        FenjanSpecialResponseSchema
      );
      if (!active) return;
      setSpecialLoading(false);
      if (!res.ok) {
        if (res.notConnected) setNotConnected(true);
        setSpecialError(res.error);
        return;
      }
      setSpecialData(res.data);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Scroll chat to newest bubble
  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, sending, chatError]);

  // Scroll kitchen alerts panel to newest alert
  useEffect(() => {
    const el = alertsListRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [staffAlerts.length]);

  const pollOrderStatus = useCallback(
    async (orderId: string, chatLanguage: string | null) => {
      setStatusLoading(true);
      const res = await fetchFenjanJson(
        `/api/fenjan/status?orderId=${encodeURIComponent(orderId)}`,
        FenjanStatusResponseSchema
      );
      setStatusLoading(false);

      if (!res.ok) {
        setStatusError(res.error);
        if (res.notConnected) setNotConnected(true);
        return;
      }

      setStatusError(null);
      setOrderStatus(res.data);

      if (res.data.found && res.data.status) {
        const nextStatusKey = `${orderId}:${res.data.status}`;
        if (lastAnnouncedStatusRef.current !== nextStatusKey) {
          lastAnnouncedStatusRef.current = nextStatusKey;
          const isAr = chatLanguage === "ar";
          const label = isAr
            ? res.data.label_ar || res.data.label_en || res.data.status
            : res.data.label_en || res.data.label_ar || res.data.status;

          setMessages((prev) => [
            ...prev,
            {
              id: uid("st"),
              role: "status",
              text: `${orderId}: ${label}`,
              timestamp: res.data.updatedAt || new Date().toISOString(),
            },
          ]);
        }
      }
    },
    []
  );

  // Poll /api/fenjan/status every 5s after an orderId is confirmed until delivered/cancelled
  useEffect(() => {
    if (!trackedOrderId) return;
    if (isTerminalStatus(orderStatus?.status)) return;

    const chatLanguage = understood?.language ?? null;
    const immediate = setTimeout(() => {
      void pollOrderStatus(trackedOrderId, chatLanguage);
    }, 0);

    const interval = setInterval(() => {
      void pollOrderStatus(trackedOrderId, chatLanguage);
    }, STATUS_POLL_MS);

    return () => {
      clearTimeout(immediate);
      clearInterval(interval);
    };
  }, [trackedOrderId, orderStatus?.status, understood?.language, pollOrderStatus]);

  async function sendMessage(rawText: string) {
    const text = rawText.trim().slice(0, MAX_MESSAGE_CHARS);
    if (!text || sending) return;

    const activeSession =
      sessionId ||
      (() => {
        const fresh = createSessionId();
        setSessionId(fresh);
        return fresh;
      })();

    const userMsg: ChatItem = {
      id: uid("usr"),
      role: "user",
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    setChatError(null);

    const res = await fetchFenjanJson<FenjanChatResponse>(
      "/api/fenjan/chat",
      FenjanChatResponseSchema,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession,
          message: text,
        }),
      }
    );

    setSending(false);

    if (!res.ok) {
      if (res.notConnected) setNotConnected(true);
      setChatError(res.error);
      return;
    }

    setNotConnected(false);
    const data = res.data;

    setMessages((prev) => [
      ...prev,
      {
        id: uid("bot"),
        role: "bot",
        text: data.reply,
        timestamp: new Date().toISOString(),
      },
    ]);

    if (data.cart !== undefined) {
      setCart(data.cart ?? null);
    }

    if (typeof data.staffAlert === "string" && data.staffAlert.trim().length > 0) {
      const alertText = data.staffAlert;
      setStaffAlerts((prev) => [
        ...prev,
        {
          id: uid("alert"),
          text: alertText,
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    if (data.intent !== undefined || data.language !== undefined) {
      setUnderstood({
        intent: data.intent ?? null,
        language: data.language ?? null,
      });
    }

    if (typeof data.open === "boolean") {
      setCafeHours({
        open: data.open,
        openHour: data.openHour ?? null,
      });
    }

    const confirmedOrderId = data.orderId?.trim();
    if (confirmedOrderId) {
      lastAnnouncedStatusRef.current = null;
      setOrderStatus(null);
      setStatusError(null);
      setTrackedOrderId(confirmedOrderId);
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const msg = input;
    setInput("");
    void sendMessage(msg);
    inputRef.current?.focus();
  }

  function handleReset() {
    const freshId = createSessionId();
    try {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, freshId);
    } catch {
      /* ignore storage errors */
    }
    setSessionId(freshId);
    setMessages([]);
    setStaffAlerts([]);
    setInput("");
    setChatError(null);
    setCart(null);
    setUnderstood(null);
    setCafeHours(null);
    setTrackedOrderId(null);
    setOrderStatus(null);
    setStatusError(null);
    lastAnnouncedStatusRef.current = null;
    inputRef.current?.focus();
  }

  const chatLanguage = understood?.language ?? null;
  const activeOrderLabel =
    chatLanguage === "ar"
      ? orderStatus?.label_ar || orderStatus?.label_en || orderStatus?.status
      : orderStatus?.label_en || orderStatus?.label_ar || orderStatus?.status;

  return (
    <div className="space-y-4">
      {/* Top Info & Live Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3">
        <div className="flex flex-wrap items-center gap-2.5 text-sm">
          <span className="text-muted">
            The same bot also answers on Messenger and Instagram.
          </span>

          {notConnected && (
            <Badge tone="warning">Not connected</Badge>
          )}

          {cafeHours && (
            <Badge tone={cafeHours.open ? "success" : "warning"}>
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  cafeHours.open ? "bg-success" : "bg-warning"
                )}
                aria-hidden
              />
              {formatOpenLabel(cafeHours.open, cafeHours.openHour)}
            </Badge>
          )}

          {understood && (understood.intent || understood.language) && (
            <Badge tone="info" className="gap-1.5">
              <Sparkles className="h-3 w-3" aria-hidden />
              <span>
                AI understood: {understood.intent || "—"} ·{" "}
                {understood.language || "—"}
              </span>
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {KITCHEN_FORM_URL && (
            <a
              href={KITCHEN_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Kitchen form
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={sending}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Reset
          </Button>
        </div>
      </div>

      {/* Clear warning banner when FENJAN_*_URL env vars are missing */}
      {notConnected && (
        <Notice tone="warning">
          This demo is not connected to n8n right now (<code className="text-xs">FENJAN_*_URL</code>{" "}
          env vars returned 503). Configure the webhook URLs on the server to chat live.
        </Notice>
      )}

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden">
        <div
          role="tablist"
          aria-label="Fenjan demo views"
          className="grid grid-cols-3 gap-1 rounded-[var(--radius-btn)] border border-border bg-surface-2 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === "chat"}
            onClick={() => setMobileTab("chat")}
            className={cn(
              "rounded-[8px] px-2.5 py-2 text-xs font-medium transition-colors",
              mobileTab === "chat"
                ? "bg-surface text-text shadow-sm"
                : "text-muted hover:text-text"
            )}
          >
            Chat
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === "kitchen"}
            onClick={() => setMobileTab("kitchen")}
            className={cn(
              "rounded-[8px] px-2.5 py-2 text-xs font-medium transition-colors",
              mobileTab === "kitchen"
                ? "bg-surface text-text shadow-sm"
                : "text-muted hover:text-text"
            )}
          >
            Kitchen{staffAlerts.length > 0 ? ` (${staffAlerts.length})` : ""}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === "side"}
            onClick={() => setMobileTab("side")}
            className={cn(
              "rounded-[8px] px-2.5 py-2 text-xs font-medium transition-colors",
              mobileTab === "side"
                ? "bg-surface text-text shadow-sm"
                : "text-muted hover:text-text"
            )}
          >
            Cart & Special
            {cart && cart.items.length > 0 ? ` (${cart.items.length})` : ""}
          </button>
        </div>
      </div>

      {/* Main Responsive Split */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Left: Chat */}
        <section
          aria-label="Fenjan Café live chat"
          className={cn(
            "flex h-[540px] flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface lg:col-span-7",
            mobileTab !== "chat" && "hidden lg:flex"
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h3 className="font-sans text-sm font-semibold text-text">
                Fenjan Café · Web Chat
              </h3>
              <p className="text-xs text-muted">
                Live session · Arabic, English, or Franco
              </p>
            </div>
            {sessionId && (
              <span className="font-mono text-[11px] text-muted" title="Session ID">
                {sessionId}
              </span>
            )}
          </div>

          <div
            ref={listRef}
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
            className="flex-1 overflow-y-auto px-4 py-4"
          >
            {messages.length === 0 && !chatError ? (
              <EmptyState
                icon={<MessageSquare className="h-6 w-6" />}
                title="Message Fenjan Café"
                body="Send a message below or pick a quick-reply chip. Replies, cart totals, and order IDs come straight from n8n."
              />
            ) : (
              <ol className="space-y-3">
                {messages.map((m) => {
                  if (m.role === "status") {
                    return (
                      <li key={m.id} className="flex justify-center">
                        <span
                          dir={isMostlyArabic(m.text) ? "rtl" : "ltr"}
                          lang={isMostlyArabic(m.text) ? "ar" : "en"}
                          className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-muted"
                        >
                          {m.text}
                        </span>
                      </li>
                    );
                  }

                  const rtl = isMostlyArabic(m.text);
                  const isUser = m.role === "user";

                  return (
                    <li
                      key={m.id}
                      className={cn(
                        "flex flex-col",
                        isUser ? "items-end" : "items-start"
                      )}
                    >
                      <div
                        dir={rtl ? "rtl" : "ltr"}
                        lang={rtl ? "ar" : "en"}
                        className={cn(
                          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                          isUser
                            ? "rounded-br-md bg-accent text-accent-contrast"
                            : "rounded-bl-md border border-border bg-surface-2/70 text-text",
                          rtl && "text-right"
                        )}
                      >
                        <span className="sr-only">
                          {isUser ? "You: " : "Fenjan Café: "}
                        </span>
                        {m.text}
                      </div>
                      <time
                        dateTime={m.timestamp}
                        className="mt-1 px-1 text-[11px] text-muted"
                      >
                        {formatTime(m.timestamp)}
                      </time>
                    </li>
                  );
                })}

                {sending && (
                  <li aria-label="Fenjan Café is typing">
                    <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-surface-2 px-4 py-3">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-muted animate-blink"
                          style={{ animationDelay: `${i * 0.18}s` }}
                        />
                      ))}
                    </div>
                  </li>
                )}
              </ol>
            )}

            {chatError && (
              <div className="mt-3">
                <ErrorState
                  message={chatError}
                  onRetry={() => {
                    const lastUser = [...messages]
                      .reverse()
                      .find((m) => m.role === "user");
                    if (lastUser) void sendMessage(lastUser.text);
                    else setChatError(null);
                  }}
                />
              </div>
            )}
          </div>

          {/* Input & Quick-Reply Chips */}
          <div className="border-t border-border p-3">
            <div
              className="mb-2.5 flex flex-wrap gap-1.5"
              aria-label="Quick-reply examples"
            >
              {QUICK_CHIPS.map((chip) => {
                const rtl = isMostlyArabic(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    dir={rtl ? "rtl" : "ltr"}
                    lang={rtl ? "ar" : "en"}
                    disabled={sending}
                    onClick={() => void sendMessage(chip)}
                    className="rounded-full border border-border bg-surface-2/60 px-3 py-1 text-xs text-text transition-colors hover:border-accent/50 hover:bg-surface-2 disabled:opacity-50"
                  >
                    {chip}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
              <label htmlFor="fenjan-chat-input" className="sr-only">
                Type a message to Fenjan Café
              </label>
              <input
                id="fenjan-chat-input"
                ref={inputRef}
                type="text"
                dir="auto"
                value={input}
                maxLength={MAX_MESSAGE_CHARS}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
                placeholder="Order in Arabic, English, or Franco…"
                className="h-10 flex-1 rounded-[var(--radius-btn)] border border-border bg-bg/50 px-3 text-sm text-text placeholder:text-muted/80 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || sending}
                aria-label="Send message"
              >
                {sending ? (
                  <RotateCw className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <ArrowUp className="h-4 w-4" aria-hidden />
                )}
              </Button>
            </form>
          </div>
        </section>

        {/* Right: Fenjan Kitchen · Telegram (read-only staff alert feed) */}
        <section
          aria-label="Fenjan Kitchen Telegram alerts"
          className={cn(
            "flex h-[540px] flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface lg:col-span-5",
            mobileTab !== "kitchen" && "hidden lg:flex"
          )}
        >
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-sans text-sm font-semibold text-text">
                Fenjan Kitchen · Telegram
              </h3>
              <Badge tone="neutral">staff</Badge>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              New orders and &quot;call a human&quot; alerts arrive here. This is the message the kitchen gets in Telegram.
            </p>
          </div>

          <div
            ref={alertsListRef}
            role="log"
            aria-live="polite"
            aria-label="Telegram alert messages"
            className="flex-1 overflow-y-auto px-4 py-4"
          >
            {staffAlerts.length === 0 ? (
              <div className="flex h-full items-center justify-center px-4 text-center">
                <p className="text-sm text-muted">
                  No alerts yet. Try ordering something, or write &quot;I need a human&quot;.
                </p>
              </div>
            ) : (
              <ol className="space-y-3">
                {staffAlerts.map((alert) => (
                  <li key={alert.id}>
                    <div className="rounded-2xl rounded-bl-md border border-border bg-surface-2/70 px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-accent">
                          Fenjan Bot
                        </span>
                        <time
                          dateTime={alert.timestamp}
                          className="text-[11px] text-muted"
                        >
                          {formatTime(alert.timestamp)}
                        </time>
                      </div>
                      <p
                        dir="auto"
                        className="mt-1.5 text-left text-sm leading-relaxed text-text whitespace-pre-wrap"
                      >
                        {alert.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </div>

      {/* Lower Row: Live Cart + Order Tracker + Daily Special */}
      <div
        className={cn(
          "grid gap-5 lg:grid-cols-12",
          mobileTab !== "side" && "hidden lg:grid"
        )}
      >
        <div className="flex flex-col gap-5 lg:col-span-7">
          {/* Live Cart Panel */}
          <section
            aria-label="Live cart"
            className="rounded-[var(--radius-card)] border border-border bg-surface p-4"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-accent" aria-hidden />
                <h3 className="font-sans text-sm font-semibold text-text">
                  Live cart
                </h3>
              </div>
              {cart?.mode && (
                <Badge tone="neutral">{cart.mode}</Badge>
              )}
            </div>

            {!cart || cart.items.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted">No items in your cart yet.</p>
                <p className="mt-1 text-xs text-muted">
                  Cart lines and totals appear directly from n8n.
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {cart.address && (
                  <p className="rounded-md bg-surface-2 px-3 py-2 text-xs text-muted">
                    <span className="font-medium text-text">Address:</span>{" "}
                    <span dir="auto">{cart.address}</span>
                  </p>
                )}

                <ul className="divide-y divide-border text-sm">
                  {cart.items.map((item) => (
                    <li
                      key={`${item.id}-${item.name}`}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <span dir="auto" className="min-w-0 truncate text-text">
                        {item.qty} × {item.name}
                      </span>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                        {item.lineTotal} {cart.currency}
                      </span>
                    </li>
                  ))}
                </ul>

                <dl className="space-y-1.5 border-t border-border pt-3 text-xs">
                  <div className="flex justify-between text-muted">
                    <dt>Subtotal</dt>
                    <dd className="font-mono tabular-nums">
                      {cart.subtotal} {cart.currency}
                    </dd>
                  </div>
                  <div className="flex justify-between text-muted">
                    <dt>Delivery fee</dt>
                    <dd className="font-mono tabular-nums">
                      {cart.deliveryFee} {cart.currency}
                    </dd>
                  </div>
                  <div className="flex justify-between pt-1 text-sm font-semibold text-text">
                    <dt>Total</dt>
                    <dd className="font-mono tabular-nums">
                      {cart.total} {cart.currency}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </section>

          {/* Order Tracker Card */}
          {trackedOrderId && (
            <section
              aria-label="Confirmed order status tracker"
              aria-live="polite"
              className="rounded-[var(--radius-card)] border border-accent/35 bg-surface p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-accent" aria-hidden />
                  <h3 className="font-sans text-sm font-semibold text-text">
                    Order tracker
                  </h3>
                </div>
                <span className="font-mono text-xs font-semibold text-accent">
                  {trackedOrderId}
                </span>
              </div>

              {statusError ? (
                <div className="mt-3">
                  <ErrorState
                    message={statusError}
                    onRetry={() =>
                      void pollOrderStatus(trackedOrderId, chatLanguage)
                    }
                  />
                </div>
              ) : (
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      tone={
                        orderStatus?.status === "delivered"
                          ? "success"
                          : orderStatus?.status === "cancelled"
                            ? "danger"
                            : "info"
                      }
                    >
                      {orderStatus?.status || (statusLoading ? "checking…" : "confirmed")}
                    </Badge>
                    {!isTerminalStatus(orderStatus?.status) && (
                      <span className="text-[11px] text-muted">
                        Polling every 5s
                      </span>
                    )}
                  </div>

                  {activeOrderLabel && (
                    <p
                      dir={isMostlyArabic(activeOrderLabel) ? "rtl" : "ltr"}
                      lang={isMostlyArabic(activeOrderLabel) ? "ar" : "en"}
                      className="text-sm text-text"
                    >
                      {activeOrderLabel}
                    </p>
                  )}

                  {orderStatus?.updatedAt && (
                    <p className="text-xs text-muted">
                      Updated: {formatTime(orderStatus.updatedAt)}
                    </p>
                  )}
                </div>
              )}
            </section>
          )}
        </div>

        <div className="lg:col-span-5">
          {/* Daily Special Card */}
          <section
            aria-label="Daily special"
            className="rounded-[var(--radius-card)] border border-border bg-surface p-4"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
              <h3 className="font-sans text-sm font-semibold text-text">
                Today&apos;s special
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void loadSpecial()}
                disabled={specialLoading}
                className="h-7 px-2 text-xs"
              >
                <RotateCw
                  className={cn("h-3 w-3", specialLoading && "animate-spin")}
                  aria-hidden
                />
                Refresh
              </Button>
            </div>

            <div className="mt-3">
              {specialLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : specialError ? (
                <ErrorState
                  message={specialError}
                  onRetry={() => void loadSpecial()}
                />
              ) : !specialData?.found ? (
                <p className="text-sm text-muted">No special posted yet</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {specialData.text_ar && (
                    <p dir="rtl" lang="ar" className="leading-relaxed text-text">
                      {specialData.text_ar}
                    </p>
                  )}
                  {specialData.text_en && (
                    <p className="leading-relaxed text-muted">
                      {specialData.text_en}
                    </p>
                  )}
                  {specialData.postedAt && (
                    <p className="text-xs text-muted">
                      Posted {formatTime(specialData.postedAt) || specialData.postedAt}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
