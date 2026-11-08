"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import type { Candidate } from "@/lib/hr/schemas";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Formats a datetime-local value (YYYY-MM-DDTHH:mm) into
 * "Sun 9 Nov 2026, 11:00 (Cairo time)"
 */
export function formatInterviewAt(isoLocal: string, tzLabel = "Cairo time"): string {
  const dt = new Date(isoLocal);
  if (Number.isNaN(dt.getTime())) return `${isoLocal} (${tzLabel})`;
  const dayName = DAYS[dt.getDay()];
  const day = dt.getDate();
  const month = MONTHS[dt.getMonth()];
  const year = dt.getFullYear();
  const hours = String(dt.getHours()).padStart(2, "0");
  const mins = String(dt.getMinutes()).padStart(2, "0");
  return `${dayName} ${day} ${month} ${year}, ${hours}:${mins} (${tzLabel})`;
}

function defaultTomorrowEleven(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T11:00`;
}

export interface InvitePayload {
  interview_at: string;
  mode: "online" | "onsite";
  location: string;
  note?: string;
}

export function InviteModal({
  candidate,
  open,
  onOpenChange,
  onConfirm,
  submitting,
}: {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: InvitePayload) => Promise<void>;
  submitting: boolean;
}) {
  const [dateTime, setDateTime] = useState(defaultTomorrowEleven);
  const [timezone, setTimezone] = useState("Africa/Cairo");
  const [mode, setMode] = useState<"online" | "onsite">("online");
  const [location, setLocation] = useState("https://meet.google.com/dem-o-hr");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const tzLabel = timezone === "Africa/Cairo" ? "Cairo time" : timezone;
  const formattedTime = useMemo(
    () => (dateTime ? formatInterviewAt(dateTime, tzLabel) : "Not selected"),
    [dateTime, tzLabel]
  );

  if (!candidate) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!dateTime) {
      setError("Please choose a date and time.");
      return;
    }
    if (!location.trim()) {
      setError(mode === "online" ? "Please provide a meeting link." : "Please provide the office location.");
      return;
    }
    setError(null);
    await onConfirm({
      interview_at: formattedTime,
      mode,
      location: location.trim(),
      note: note.trim() || undefined,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Invite ${candidate.name} to interview`}
      description={`${candidate.role} · ${candidate.email}`}
      className="max-w-xl"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="invite-form" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {submitting ? "Sending invite…" : "Confirm & send invite"}
          </Button>
        </>
      }
    >
      <form id="invite-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="inv-dt" label="Date & time">
            <Input
              id="inv-dt"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
            />
          </Field>
          <Field id="inv-tz" label="Timezone">
            <select
              id="inv-tz"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="h-10 w-full rounded-[var(--radius-btn)] border border-border bg-surface px-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="Africa/Cairo">Africa/Cairo (Cairo time)</option>
              <option value="UTC">UTC</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Europe/Berlin">Europe/Berlin</option>
            </select>
          </Field>
        </div>

        <div>
          <span className="block text-sm font-medium">Format</span>
          <div className="mt-1.5 inline-flex rounded-[var(--radius-btn)] border border-border bg-surface-2 p-0.5">
            {(["online", "onsite"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  if (m === "online" && !location.startsWith("http")) {
                    setLocation("https://meet.google.com/dem-o-hr");
                  } else if (m === "onsite" && location.startsWith("http")) {
                    setLocation("Demo Co HQ, New Cairo, Building B, 3rd Floor");
                  }
                }}
                className={cn(
                  "rounded-[8px] px-3 py-1.5 text-sm transition-colors",
                  mode === m ? "bg-surface font-medium text-text shadow-sm" : "text-muted hover:text-text"
                )}
              >
                {m === "online" ? "Online" : "On-site"}
              </button>
            ))}
          </div>
        </div>

        <Field
          id="inv-loc"
          label={mode === "online" ? "Meeting link" : "Office address / room"}
        >
          <Input
            id="inv-loc"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={
              mode === "online"
                ? "https://meet.google.com/..."
                : "Demo Co HQ, New Cairo, Building B"
            }
            required
          />
        </Field>

        <Field id="inv-note" label="Note to candidate" optional>
          <Textarea
            id="inv-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. We'll walk through one of your past backend projects for 30 minutes."
          />
        </Field>

        {/* Live email preview */}
        <div className="rounded-[var(--radius-btn)] border border-border bg-surface-2/60 p-4">
          <p className="label-caps">Live email preview</p>
          <div className="mt-2 space-y-2 text-xs leading-relaxed text-text">
            <p className="text-muted">
              <strong className="font-medium text-text">To:</strong> {candidate.name} &lt;{candidate.email}&gt;
              <br />
              <strong className="font-medium text-text">Subject:</strong> Interview invitation — {candidate.role} at Demo Co
            </p>
            <div className="border-t border-border pt-2 whitespace-pre-line">
              {`Hi ${candidate.name},\n\nThank you for applying for the ${candidate.role} role at Demo Co. We'd love to invite you to an interview.\n\n• When: ${formattedTime}\n• Format: ${mode === "online" ? "Online video call" : "On-site interview"}\n• ${mode === "online" ? "Meeting link" : "Location"}: ${location || "—"}${note.trim() ? `\n\nNote from the team:\n${note.trim()}` : ""}\n\nPlease reply to this email if you need to adjust the time.\n\nBest,\nDemo Co Recruiting Team`}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs text-danger-text" role="alert">
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
}

