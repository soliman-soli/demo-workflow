"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — fallback silently; mailto link remains clickable
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-btn)] border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-muted/50 hover:bg-surface-2 hover:text-text cursor-pointer"
      aria-label={copied ? "Email copied to clipboard" : `Copy ${email}`}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-accent" aria-hidden />
          <span className="text-accent">Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" aria-hidden />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}
