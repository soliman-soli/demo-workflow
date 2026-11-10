"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import { FileText, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const MAX_PDF_BYTES = 4 * 1024 * 1024;

export function createSamplePdf(): File {
  const content = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 258 >>\nstream\nBT\n/F1 12 Tf\n50 740 Td\n(Alex Rivera - Full Stack & AI Automation Engineer) Tj\n0 -20 Td\n(Skills: TypeScript, Next.js, Node.js, PostgreSQL, n8n, REST APIs, Docker) Tj\n0 -20 Td\n(Experience: 4 years building backend APIs and workflow automation pipelines.) Tj\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000241 00000 n \n0000000550 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n620\n%%EOF";
  return new File([content], "Alex_Rivera_Demo_CV.pdf", { type: "application/pdf" });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Client-side pre-check; the server re-validates (mime, size, %PDF magic bytes). */
export function checkPdf(file: File): string | null {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Only PDF files are accepted.";
  if (file.size > MAX_PDF_BYTES) return `This file is ${formatBytes(file.size)}. The limit is 4 MB.`;
  if (file.size === 0) return "This file is empty.";
  return null;
}

interface Props {
  file: File | null;
  onFile: (file: File | null) => void;
  error?: string;
  label?: string;
  id?: string;
}

export function PdfDropzone({ file, onFile, error, label = "CV (PDF, max 4 MB)", id }: Props) {
  const autoId = useId();
  const inputId = id ?? `pdf-${autoId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const shownError = localError ?? error;

  function accept(f: File | undefined) {
    if (!f) return;
    const problem = checkPdf(f);
    if (problem) {
      setLocalError(problem);
      onFile(null);
      return;
    }
    setLocalError(null);
    onFile(f);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    accept(e.dataTransfer.files?.[0]);
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
      </label>
      {file ? (
        <div className="flex items-center gap-3 rounded-[var(--radius-btn)] border border-border bg-surface-2/60 px-3 py-3">
          <FileText className="h-5 w-5 shrink-0 text-accent" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="rounded-md p-1.5 text-muted hover:bg-surface hover:text-text"
            aria-label={`Remove ${file.name}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-btn)] border border-dashed px-4 py-7 text-center transition-colors duration-150",
            dragging ? "border-accent bg-accent/5" : shownError ? "border-danger" : "border-border bg-surface hover:bg-surface-2/50"
          )}
        >
          <Upload className="h-5 w-5 text-muted" aria-hidden />
          <p className="text-sm">
            <span className="font-medium text-accent">Choose a PDF</span> or drag it here
          </p>
          <p className="text-xs text-muted">
            PDF only, up to 4 MB ·{" "}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                accept(createSamplePdf());
              }}
              className="font-medium text-accent hover:underline focus:outline-none"
            >
              Use demo CV
            </button>
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        aria-invalid={shownError ? true : undefined}
        aria-describedby={shownError ? `${inputId}-error` : undefined}
        onChange={(e) => accept(e.target.files?.[0])}
      />
      {shownError && (
        <p id={`${inputId}-error`} className="text-xs text-danger-text" role="alert">
          {shownError}
        </p>
      )}
    </div>
  );
}

