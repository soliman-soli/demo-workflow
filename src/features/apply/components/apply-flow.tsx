"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Honeypot, Input } from "@/components/ui/input";
import { PdfDropzone } from "@/components/ui/pdf-dropzone";
import { SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { TurnstileWidget } from "@/components/ui/turnstile";
import { api } from "@/lib/hr/client";
import {
  ApplyResponseSchema,
  RolesResponseSchema,
  isLinkedInUrl,
  type Role,
} from "@/lib/hr/schemas";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

export function ApplyFlow() {
  const [step, setStep] = useState<Step>(1);
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Step 2 form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationMsg, setConfirmationMsg] = useState(
    "Application received. You'll hear back by email within 48 hours."
  );

  const loadRoles = useCallback(async () => {
    setRolesError(null);
    setRoles(null);
    const res = await api("/api/hr/roles", RolesResponseSchema);
    if (!res.ok) {
      setRolesError(res.error);
      setRoles([]);
      return;
    }
    setRoles(res.data.roles);
  }, []);

  useEffect(() => {
    // Initial fetch of open roles on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRoles();
  }, [loadRoles]);

  function validateStep2(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Please enter a valid email address.";
    }
    if (!linkedin.trim()) {
      errs.linkedin = "Please add your LinkedIn profile URL.";
    } else if (!isLinkedInUrl(linkedin.trim())) {
      errs.linkedin = "LinkedIn URL must be a valid linkedin.com profile link.";
    }
    if (!cv) {
      errs.cv = "Please upload your CV as a PDF.";
    }
    if (!consent) {
      errs.consent = "Please confirm you understand this is a demo.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function mapServerErrorsToFields(errors: string[]) {
    const mapped: Record<string, string> = {};
    const remaining: string[] = [];
    for (const err of errors) {
      const lower = err.toLowerCase();
      if (lower.includes("name") && !mapped.name) mapped.name = err;
      else if (lower.includes("email") && !lower.includes("already") && !mapped.email) mapped.email = err;
      else if (lower.includes("linkedin") && !mapped.linkedin) mapped.linkedin = err;
      else if ((lower.includes("pdf") || lower.includes("cv") || lower.includes("file")) && !mapped.cv) mapped.cv = err;
      else if (lower.includes("consent") || lower.includes("confirm")) mapped.consent = err;
      else remaining.push(err);
    }
    if (Object.keys(mapped).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...mapped }));
    }
    setApiErrors(remaining.length > 0 ? remaining : errors);
  }

  async function handleSubmit(formEl: HTMLFormElement) {
    if (!selectedRole || !validateStep2() || !cv || submitting) return;
    setSubmitting(true);
    setApiErrors([]);

    const form = new FormData(formEl);
    form.set("name", name.trim());
    form.set("email", email.trim());
    form.set("linkedin", linkedin.trim());
    form.set("role_id", selectedRole.id);
    form.set("cv", cv);
    form.set("consent", consent ? "true" : "false");

    const res = await api("/api/hr/apply", ApplyResponseSchema, {
      method: "POST",
      body: form,
    });
    setSubmitting(false);

    if (!res.ok) {
      mapServerErrorsToFields(res.errors?.length ? res.errors : [res.error]);
      return;
    }

    if (!res.data.ok) {
      mapServerErrorsToFields(res.data.errors);
      return;
    }

    setConfirmationMsg(
      res.data.message || "Application received. You'll hear back by email within 48 hours."
    );
    setStep(3);
  }

  // Step 3: Success screen (never reveals score or screening outcome)
  if (step === 3) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mx-auto max-w-xl rounded-[var(--radius-card)] border border-border bg-surface p-8 text-center sm:p-10"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/12 text-success">
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </div>
        <h2 className="mt-4 text-2xl font-medium">Application received.</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {confirmationMsg.includes("48 hours")
            ? confirmationMsg
            : "Application received. You'll hear back by email within 48 hours."}
        </p>
        {selectedRole && (
          <p className="mt-4 text-xs text-muted">
            Applied for <strong className="font-medium text-text">{selectedRole.title}</strong> · Confirmation sent to{" "}
            <strong className="font-medium text-text">{email}</strong>
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/projects/hr-system" className={buttonVariants({ size: "md" })}>
            Back to HR Demo
          </Link>
          <Button
            variant="outline"
            onClick={() => {
              setStep(1);
              setSelectedRole(null);
              setCv(null);
              setConsent(false);
              setFieldErrors({});
              setApiErrors([]);
            }}
          >
            See open roles
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Application Form
  if (step === 2 && selectedRole) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Selected role banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-surface-2/60 px-5 py-4">
          <div>
            <p className="label-caps">Applying for</p>
            <p className="mt-0.5 font-heading text-lg font-medium">{selectedRole.title}</p>
            <p className="text-xs text-muted">
              {selectedRole.department} · {selectedRole.location} · {selectedRole.type}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStep(1);
              setFieldErrors({});
              setApiErrors([]);
            }}
          >
            Change role
          </Button>
        </div>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit(e.currentTarget);
          }}
          className="space-y-5 rounded-[var(--radius-card)] border border-border bg-surface p-6 sm:p-8"
        >
          {apiErrors.length > 0 && (
            <div
              role="alert"
              className="rounded-[var(--radius-btn)] border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger-text"
            >
              <p className="font-medium">Please check your application:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
                {apiErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <Honeypot name="hp_email" />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="apply-name" label="Full name" error={fieldErrors.name}>
              <Input
                id="apply-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                invalid={!!fieldErrors.name}
                autoComplete="name"
                placeholder="Your full name"
              />
            </Field>
            <Field id="apply-email" label="Email" error={fieldErrors.email}>
              <Input
                id="apply-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                invalid={!!fieldErrors.email}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </Field>
          </div>

          <Field
            id="apply-linkedin"
            label="LinkedIn URL"
            hint="Must be a linkedin.com profile link."
            error={fieldErrors.linkedin}
          >
            <Input
              id="apply-linkedin"
              name="linkedin"
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              invalid={!!fieldErrors.linkedin}
              placeholder="https://www.linkedin.com/in/your-handle"
            />
          </Field>

          <PdfDropzone file={cv} onFile={setCv} error={fieldErrors.cv} label="CV (PDF, max 4 MB)" />

          <div className="space-y-1.5">
            <label htmlFor="apply-consent" className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                id="apply-consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border accent-accent"
                aria-invalid={fieldErrors.consent ? true : undefined}
              />
              <span>I understand this is a demo and my CV is analysed by AI</span>
            </label>
            {fieldErrors.consent && (
              <p className="text-xs text-danger-text" role="alert">
                {fieldErrors.consent}
              </p>
            )}
          </div>

          <TurnstileWidget />

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {submitting ? "Submitting application…" : "Submit application"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              disabled={submitting}
              onClick={() => setStep(1)}
            >
              Back to roles
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Step 1: Select open role
  return (
    <div className="space-y-6">
      {rolesError && <ErrorState message={rolesError} onRetry={() => void loadRoles()} />}

      {roles === null ? (
        <div className="grid gap-4 md:grid-cols-3" aria-label="Loading open roles">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : roles.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-border bg-surface">
          <EmptyState
            icon={<Briefcase className="h-6 w-6" />}
            title="No open roles right now"
            body="Check back soon or try the Career Coach to prepare your CV in advance."
            action={
              <Link href="/projects/hr-system/coach" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Go to Career Coach
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div
            role="radiogroup"
            aria-label="Open positions"
            className="grid gap-5 md:grid-cols-3"
          >
            {roles.map((role) => {
              const selected = selectedRole?.id === role.id;
              return (
                <div
                  key={role.id}
                  role="radio"
                  aria-checked={selected}
                  tabIndex={0}
                  onClick={() => setSelectedRole(role)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedRole(role);
                    }
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col rounded-[var(--radius-card)] border bg-surface p-6 text-left transition-[border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-0.5",
                    selected
                      ? "border-accent ring-2 ring-accent/25 shadow-sm"
                      : "border-border hover:border-accent/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Badge tone={selected ? "accent" : "neutral"}>{role.department}</Badge>
                    <span className="text-xs text-muted">{role.type}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-medium">{role.title}</h2>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
                    <MapPin className="h-3.5 w-3.5" aria-hidden /> {role.location}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{role.summary}</p>
                  <div className="mt-4 border-t border-border pt-3">
                    <p className="label-caps">Requirements</p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted">
                      {role.requirements.map((req, idx) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-auto pt-5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-[var(--radius-btn)] px-3 py-1.5 text-xs font-medium transition-colors",
                        selected
                          ? "bg-accent text-accent-contrast"
                          : "border border-border bg-surface-2 text-text"
                      )}
                    >
                      {selected ? "Selected" : "Select role"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              size="lg"
              disabled={!selectedRole}
              onClick={() => {
                if (selectedRole) setStep(2);
              }}
            >
              Continue with {selectedRole ? selectedRole.title : "selected role"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
