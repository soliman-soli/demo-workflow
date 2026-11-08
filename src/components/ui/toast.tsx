"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "success" | "error";
interface ToastItem {
  id: number;
  message: string;
  variant: Variant;
}

const ToastContext = createContext<{ toast: (message: string, variant?: Variant) => void }>({
  toast: () => {},
});

export const useToast = () => useContext(ToastContext);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => setItems((p) => p.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (message: string, variant: Variant = "success") => {
      const id = nextId++;
      setItems((p) => [...p, { id, message, variant }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2 sm:w-96"
        role="status"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className="animate-fade flex items-start gap-3 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 text-sm shadow-lg"
          >
            {t.variant === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
            )}
            <span className={cn("flex-1", t.variant === "error" && "text-danger-text")}>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="rounded p-0.5 text-muted hover:text-text"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
