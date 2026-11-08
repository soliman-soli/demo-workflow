"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { PdfDropzone } from "@/components/ui/pdf-dropzone";
import { Notice } from "@/components/ui/states";
import { api } from "@/lib/hr/client";
import { PoliciesResponseSchema } from "@/lib/hr/schemas";
import { cn } from "@/lib/utils";

type Mode = "text" | "pdf";

export function AddPoliciesDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (company: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("text");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ added: number; company: string } | null>(null);

  function reset() {
    setCompany("");
    setTitle("");
    setText("");
    setFile(null);
    setError(null);
    setSuccess(null);
    setMode("text");
  }

  const canSubmit =
    company.trim().length > 0 && (mode === "pdf" ? file !== null : title.trim().length > 0 && text.trim().length > 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);

    const form = new FormData();
    form.append("company", company.trim());
    if (mode === "pdf" && file) form.append("file", file);
    else {
      form.append("title", title.trim());
      form.append("text", text.trim());
    }

    const res = await api("/api/hr/policies", PoliciesResponseSchema, { method: "POST", body: form });
    setSubmitting(false);
    if (!res.ok || !res.data.ok) {
      setError(res.ok ? "The policies couldn't be added. Please try again." : res.error);
      return;
    }
    setSuccess({ added: res.data.added, company: res.data.company });
    onAdded(res.data.company);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
      title="Add company policies"
      description="Ask questions against your own policies."
      footer={
        success ? (
          <Button onClick={() => onOpenChange(false)}>Start asking</Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form="add-policies-form" disabled={!canSubmit || submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {submitting ? "Adding…" : "Add policies"}
            </Button>
          </>
        )
      }
    >
      {success ? (
        <div className="flex flex-col items-center py-6 text-center" role="status">
          <CheckCircle2 className="h-8 w-8 text-success" aria-hidden />
          <p className="mt-3 font-heading text-lg">
            Added {success.added} section{success.added === 1 ? "" : "s"} to {success.company}
          </p>
          <p className="mt-1 text-sm text-muted">The company is now selected in the chat.</p>
        </div>
      ) : (
        <form id="add-policies-form" onSubmit={submit} className="space-y-4">
          <Field id="pol-company" label="Company name">
            <Input id="pol-company" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={120} placeholder="e.g. Acme Ltd" required />
          </Field>

          <div role="tablist" aria-label="Policy source" className="inline-flex rounded-[var(--radius-btn)] border border-border bg-surface-2 p-0.5">
            {(["text", "pdf"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-[8px] px-3 py-1.5 text-sm transition-colors",
                  mode === m ? "bg-surface font-medium text-text shadow-sm" : "text-muted hover:text-text"
                )}
              >
                {m === "text" ? "Paste text" : "Upload PDF"}
              </button>
            ))}
          </div>

          {mode === "text" ? (
            <>
              <Field id="pol-title" label="Policy title">
                <Input id="pol-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="e.g. Remote Work Policy" />
              </Field>
              <Field id="pol-text" label="Policy text" hint={`${text.length.toLocaleString()} / 50,000 characters`}>
                <Textarea id="pol-text" value={text} onChange={(e) => setText(e.target.value)} maxLength={50_000} rows={7} placeholder="Paste the policy here…" />
              </Field>
            </>
          ) : (
            <PdfDropzone file={file} onFile={setFile} label="Policy document (PDF, max 4 MB)" />
          )}

          {submitting && (
            <div className="space-y-1.5" role="status" aria-live="polite">
              <div className="h-1 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
              </div>
              <p className="text-xs text-muted">Splitting the policy into sections and saving them…</p>
            </div>
          )}

          {error && (
            <p className="text-sm text-danger-text" role="alert">
              {error}
            </p>
          )}

          <Notice tone="info">Policies you add are stored in a shared demo sheet and are visible to other visitors.</Notice>
        </form>
      )}
    </Dialog>
  );
}

