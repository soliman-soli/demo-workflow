"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, ImagePlus, MessageSquare, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import type { PharmacyChatMessage } from "@/lib/pharmacy/schemas";
import { cn } from "@/lib/utils";

const QUICK_CHIPS: Array<{ label: string; kind: "text" | "photo"; value: string }> = [
  { label: "Panadol 500 x2", kind: "text", value: "Panadol 500 x2" },
  { label: "عايز ٢ بانادول اكسترا", kind: "text", value: "عايز ٢ بانادول اكسترا" },
  { label: "Panadool (typo)", kind: "text", value: "Panadool (typo)" },
  { label: "Brufen 400, Antinal", kind: "text", value: "Brufen 400, Antinal" },
  { label: "Augmentin 1g", kind: "text", value: "Augmentin 1g" },
  { label: "Prescription photo", kind: "photo", value: "" },
  { label: "Hi", kind: "text", value: "Hi" },
];

function formatBubbleTime(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface WhatsAppPanelProps {
  messages: PharmacyChatMessage[];
  previews: Record<string, string>;
  loadingState: boolean;
  sending: boolean;
  error: string | null;
  onRetryLoad: () => void;
  onSendText: (text: string) => void;
  onSendPhoto: (file: File, caption?: string) => void;
  onSendSampleRx: () => void;
}

export function WhatsAppPanel({
  messages,
  previews,
  loadingState,
  sending,
  error,
  onRetryLoad,
  onSendText,
  onSendPhoto,
  onSendSampleRx,
}: WhatsAppPanelProps) {
  const [input, setInput] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, sending]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setUploadError(null);
    onSendText(trimmed);
    setInput("");
    inputRef.current?.focus();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || sending) return;

    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowed.has(file.type)) {
      setUploadError("Only JPEG, PNG, or WebP images are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be 5 MB or smaller.");
      return;
    }

    setUploadError(null);
    const caption = input.trim();
    if (caption) setInput("");
    onSendPhoto(file, caption || undefined);
  }

  return (
    <section
      aria-label="Customer WhatsApp simulator"
      className="flex h-[560px] flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-[#0b141a] text-[#e9edef]"
    >
      {/* WhatsApp Business Header */}
      <div className="flex items-center gap-3 border-b border-[#1f2c34] bg-[#122620] px-4 py-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25d366]/20 font-heading text-sm font-semibold text-[#5fd38d] ring-1 ring-[#25d366]/40"
          aria-hidden
        >
          D
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-sans text-sm font-semibold text-[#e9edef]">
              Dawaa Pharmacy
            </h3>
            <span
              className="inline-block h-2 w-2 rounded-full bg-[#25d366]"
              title="Verified business account"
              aria-hidden
            />
          </div>
          <p className="truncate text-[11px] text-[#8ea59b]">WhatsApp Business</p>
        </div>
      </div>

      {/* Chat Log */}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="WhatsApp conversation"
        className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(31,111,92,0.12),transparent_55%),#0b141a] px-3 py-4"
      >
        {loadingState ? (
          <div className="space-y-3 p-2">
            <Skeleton className="h-12 w-3/4 bg-[#1c292f]" />
            <Skeleton className="ml-auto h-10 w-2/3 bg-[#153c30]" />
            <Skeleton className="h-16 w-4/5 bg-[#1c292f]" />
          </div>
        ) : error ? (
          <div className="p-2">
            <ErrorState message={error} onRetry={onRetryLoad} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <MessageSquare className="h-6 w-6 text-[#5fd38d]" aria-hidden />
            <p className="font-heading text-lg text-[#e9edef]">
              Start a pharmacy order
            </p>
            <p className="max-w-xs text-xs leading-relaxed text-[#9ab0a7]">
              Try typing a medicine name, an Arabic request, a typo like Panadool, or upload a prescription photo below.
            </p>
          </div>
        ) : (
          <ol className="space-y-2.5">
            {messages.map((m) => {
              const isCustomer = m.sender === "customer";
              const previewSrc = m.image_name ? previews[m.id] : undefined;

              return (
                <li
                  key={m.id}
                  className={cn(
                    "flex flex-col",
                    isCustomer ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[88%] rounded-xl px-3 py-2 text-[13px] leading-relaxed shadow-sm",
                      isCustomer
                        ? "rounded-br-xs bg-[#005c4b] text-[#e9edef]"
                        : "rounded-bl-xs border border-[#223138] bg-[#1b272c] text-[#e9edef]"
                    )}
                  >
                    <span className="sr-only">
                      {isCustomer ? "Customer: " : "Dawaa Bot: "}
                    </span>
                    {previewSrc && (
                      <div className="mb-2 overflow-hidden rounded-lg border border-white/10 bg-[#14181a]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewSrc}
                          alt={m.image_name || "Uploaded prescription preview"}
                          className="max-h-36 w-full object-cover"
                        />
                      </div>
                    )}
                    {m.image_name && !previewSrc && (
                      <p className="mb-1 inline-flex items-center gap-1 rounded bg-black/25 px-2 py-0.5 font-mono text-[11px] text-[#a7d7c5]">
                        [Photo: {m.image_name}]
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    {m.text_ar && (
                      <p
                        dir="rtl"
                        className="mt-1.5 border-t border-white/10 pt-1.5 text-right whitespace-pre-wrap text-[#d4e7df]"
                      >
                        {m.text_ar}
                      </p>
                    )}
                    <div className="mt-1 flex items-center justify-end gap-2 text-[10px] text-[#9ab0a7]">
                      {m.request_id && (
                        <span className="font-mono text-[#7ad6a8]">
                          {m.request_id}
                        </span>
                      )}
                      <time dateTime={m.timestamp}>
                        {formatBubbleTime(m.timestamp)}
                      </time>
                    </div>
                  </div>
                </li>
              );
            })}

            {sending && (
              <li aria-label="Dawaa bot is typing" className="flex items-start">
                <div className="inline-flex items-center gap-1 rounded-xl rounded-bl-xs border border-[#223138] bg-[#1b272c] px-3.5 py-2.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-[#7ad6a8] animate-blink"
                      style={{ animationDelay: `${i * 0.18}s` }}
                    />
                  ))}
                </div>
              </li>
            )}
          </ol>
        )}
      </div>

      {/* Composer + Quick-reply chips */}
      <div className="border-t border-[#1f2c34] bg-[#131d22] p-2.5">
        {uploadError && (
          <p
            role="alert"
            className="mb-2 flex items-center justify-between rounded-md bg-danger/15 px-2.5 py-1.5 text-xs text-[#f6a59e]"
          >
            <span>{uploadError}</span>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="ml-2 underline hover:no-underline"
            >
              Dismiss
            </button>
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload prescription photo"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={sending}
            onClick={() => fileInputRef.current?.click()}
            title="Upload JPEG/PNG/WebP prescription (max 5 MB)"
            aria-label="Upload prescription photo"
            className="h-9 w-9 shrink-0 rounded-full text-[#9ab0a7] hover:bg-[#1f2c34] hover:text-[#e9edef]"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>

          <label htmlFor="wa-medicine-input" className="sr-only">
            Medicine message
          </label>
          <input
            id="wa-medicine-input"
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 500))}
            disabled={sending}
            placeholder="Type a medicine... e.g. Brufen 400"
            className="h-9 flex-1 rounded-full border border-[#273840] bg-[#1b272c] px-3.5 text-[13px] text-[#e9edef] placeholder:text-[#7f928b] focus:border-[#25d366] focus:outline-none disabled:opacity-60"
          />

          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || sending}
            aria-label="Send WhatsApp message"
            className="h-9 w-9 shrink-0 rounded-full bg-[#1f6f5c] text-white hover:bg-[#25856e]"
          >
            {sending ? (
              <RotateCw className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <ArrowUp className="h-4 w-4" aria-hidden />
            )}
          </Button>
        </form>

        {/* Quick-reply chips under the input */}
        <div
          className="mt-2 flex flex-wrap gap-1.5"
          aria-label="Quick-reply examples"
        >
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              disabled={sending}
              onClick={() => {
                setUploadError(null);
                if (chip.kind === "photo") {
                  onSendSampleRx();
                } else {
                  onSendText(chip.value);
                }
              }}
              className="rounded-full border border-[#2a3b42] bg-[#1a252a] px-2.5 py-1 text-[11px] text-[#c7d4cf] transition-colors hover:border-[#25d366]/60 hover:bg-[#213338] hover:text-white disabled:opacity-50"
            >
              {chip.kind === "photo" ? "📷 " : ""}
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
