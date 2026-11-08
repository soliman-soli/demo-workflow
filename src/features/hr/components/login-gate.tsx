"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function LoginGate() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/hr/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Incorrect passcode. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/projects/hr-system/hr/dashboard");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please check your connection.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <Link
        href="/projects/hr-system"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to HR Demo
      </Link>

      <div className="mt-6 rounded-[var(--radius-card)] border border-border bg-surface p-6 sm:p-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-btn)] bg-surface-2 text-accent">
          <LockKeyhole className="h-5 w-5" aria-hidden />
        </div>
        <h1 className="mt-4 text-2xl font-medium">Recruiter dashboard</h1>
        <p className="mt-1.5 text-sm text-muted">
          Enter the recruiter passcode to view candidate screening reports and send interview invites.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <Field id="hr-passcode" label="Passcode" error={error ?? undefined}>
            <Input
              id="hr-passcode"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              invalid={!!error}
              placeholder="Enter demo passcode"
              autoFocus
              required
            />
          </Field>

          <Button type="submit" size="lg" className="w-full" disabled={!passcode.trim() || loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {loading ? "Signing in…" : "Enter dashboard"}
          </Button>
        </form>

        <p className="mt-5 border-t border-border pt-4 text-xs text-muted">
          Demo recruiters only. Ask Soliman for access.
        </p>
      </div>
    </div>
  );
}

