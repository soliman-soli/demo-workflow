import { AlertCircle, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./button";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-[var(--radius-card)] border border-danger/30 bg-danger/8 p-5 sm:flex-row sm:items-center">
      <AlertCircle className="h-5 w-5 shrink-0 text-danger" aria-hidden />
      <p className="flex-1 text-sm text-danger-text">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw className="h-3.5 w-3.5" aria-hidden /> Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, body, action, icon }: { title: string; body?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      {icon && <div className="mb-1 text-muted">{icon}</div>}
      <p className="font-heading text-lg">{title}</p>
      {body && <p className="max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Notice({ children, tone = "warning" }: { children: ReactNode; tone?: "warning" | "info" }) {
  const cls =
    tone === "warning"
      ? "border-warning/30 bg-warning/10 text-warning-text"
      : "border-info/30 bg-info/10 text-info-text";
  return <div className={`rounded-[var(--radius-btn)] border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

