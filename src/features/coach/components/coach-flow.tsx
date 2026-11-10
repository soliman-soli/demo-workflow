"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Honeypot, Input, Textarea } from "@/components/ui/input";
import { PdfDropzone, createSamplePdf } from "@/components/ui/pdf-dropzone";
import { ErrorState, Notice } from "@/components/ui/states";
import { TurnstileWidget } from "@/components/ui/turnstile";
import { api } from "@/lib/hr/client";
import { CoachResponseSchema, RolesResponseSchema, type CoachReport, type Role } from "@/lib/hr/schemas";
import { CoachReportView } from "./coach-report";

const LOADING_STEPS = ["Reading your CV", "Comparing with the role", "Writing your report"];

export function CoachFlow() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [showJd, setShowJd] = useState(false);
  const [jd, setJd] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [report, setReport] = useState<CoachReport | null>(null);

  useEffect(() => {
    void api("/api/hr/roles", RolesResponseSchema).then((r) => {
      if (r.ok) setRoles(r.data.roles);
    });
  }, []);

  useEffect(() => {
    if (!submitting) return;
    const id = setInterval(() => setStepIdx((i) => (i + 1) % LOADING_STEPS.length), 6000);
    return () => clearInterval(id);
  }, [submitting]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "Please enter a valid email address.";
    if (!role.trim()) errs.role = "Please enter the role you're targeting.";
    if (!cv) errs.cv = "Please upload your CV as a PDF.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit(formEl?: HTMLFormElement) {
    if (!validate() || !cv) return;
    setSubmitting(true);
    setStepIdx(0);
    setApiError(null);

    const form = new FormData(formEl);
    form.set("name", name.trim());
    form.set("email", email.trim());
    form.set("role", role.trim());
    if (jd.trim()) form.set("job_description", jd.trim());
    else form.delete("job_description");
    form.set("cv", cv);

    const res = await api("/api/hr/coach", CoachResponseSchema, { method: "POST", body: form });
    setSubmitting(false);

    if (!res.ok) {
      setApiError(res.error);
      return;
    }
    if (!res.data.ok) {
      setApiError(res.data.error);
      return;
    }
    setReport(res.data.report);
  }

  if (report) {
    return (
      <CoachReportView
        report={report}
        role={role.trim()}
        email={email.trim()}
        onReset={() => {
          setReport(null);
          setApiError(null);
        }}
      />
    );
  }

  if (submitting) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-border bg-surface px-6 py-20 text-center"
      >
        <Loader2 className="h-7 w-7 animate-spin text-accent" aria-hidden />
        <p className="mt-5 font-heading text-2xl">{LOADING_STEPS[stepIdx]}…</p>
        <p className="mt-2 max-w-sm text-sm text-muted">
          This usually takes 20 to 40 seconds while the model reads your CV and writes your cover letter.
        </p>
        <ol className="mt-6 flex gap-2" aria-label="Progress">
          {LOADING_STEPS.map((label, i) => (
            <li
              key={label}
              className={`rounded-md px-2.5 py-1 text-xs ${i === stepIdx ? "bg-accent/12 font-medium text-accent" : "text-muted"}`}
            >
              {i + 1}. {label}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit(e.currentTarget);
      }}
      className="mx-auto max-w-2xl space-y-6 rounded-[var(--radius-card)] border border-border bg-surface p-6 sm:p-8"
    >
      {apiError && <ErrorState message={apiError} onRetry={() => void submit()} />}

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h2 className="text-base font-medium">CV & Role Analysis</h2>
          <p className="text-xs text-muted">Upload your resume to receive match score, gap analysis, and interview prep.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setName("Alex Rivera");
            setEmail("alex.rivera@example.com");
            setRole("Full-Stack Software Engineer");
            setCv(createSamplePdf());
            setFieldErrors({});
          }}
          className="rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:border-accent/50"
        >
          Fill demo data
        </button>
      </div>

      <Honeypot name="hp_name" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="coach-name" label="Your name" error={fieldErrors.name}>
          <Input id="coach-name" name="name" value={name} onChange={(e) => setName(e.target.value)} invalid={!!fieldErrors.name} autoComplete="name" />
        </Field>
        <Field id="coach-email" label="Email" hint="We'll send your cover letter here." error={fieldErrors.email}>
          <Input id="coach-email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!fieldErrors.email} autoComplete="email" />
        </Field>
      </div>

      <Field id="coach-role" label="Target role" error={fieldErrors.role}>
        <Input
          id="coach-role"
          name="role"
          list="open-role-suggestions"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          invalid={!!fieldErrors.role}
          placeholder="e.g. Full-Stack Software Engineer"
        />
        <datalist id="open-role-suggestions">
          {roles.map((r) => (
            <option key={r.id} value={r.title} />
          ))}
        </datalist>
        {roles.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted">Open roles:</span>
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.title)}
                className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-xs hover:border-accent/50"
              >
                {r.title}
              </button>
            ))}
          </div>
        )}
      </Field>

      <div>
        <button
          type="button"
          onClick={() => setShowJd((s) => !s)}
          aria-expanded={showJd}
          aria-controls="jd-box"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${showJd ? "rotate-180" : ""}`} aria-hidden />
          {showJd ? "Hide job description" : "Paste a job description (optional)"}
        </button>
        {showJd && (
          <div id="jd-box" className="mt-3">
            <Field id="coach-jd" label="Job description" optional>
              <Textarea id="coach-jd" name="job_description" value={jd} onChange={(e) => setJd(e.target.value)} rows={5} maxLength={10_000} placeholder="Paste the responsibilities and requirements for a sharper comparison…" />
            </Field>
          </div>
        )}
      </div>

      <PdfDropzone file={cv} onFile={setCv} error={fieldErrors.cv} />

      <TurnstileWidget />

      <Notice>This is a demo. Don&apos;t upload sensitive documents. Your cover letter is really sent by email.</Notice>

      <Button type="submit" size="lg" className="w-full sm:w-auto">
        Get my report
      </Button>
    </form>
  );
}
