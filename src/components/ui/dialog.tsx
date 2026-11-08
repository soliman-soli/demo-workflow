"use client";

import * as RD from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Centered modal with focus trap, Esc to close and labelled title. */
export function Dialog({ open, onOpenChange, title, description, children, footer, className }: BaseProps) {
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="fixed inset-0 z-[60] bg-black/40 animate-fade" />
        <RD.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[61] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-card)] border border-border bg-surface shadow-xl animate-fade max-h-[90vh] flex flex-col",
            className
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div>
              <RD.Title className="font-heading text-lg font-semibold">{title}</RD.Title>
              {description ? (
                <RD.Description className="mt-1 text-sm text-muted">{description}</RD.Description>
              ) : (
                <RD.Description className="sr-only">{title}</RD.Description>
              )}
            </div>
            <RD.Close className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-text" aria-label="Close">
              <X className="h-4 w-4" />
            </RD.Close>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

/** Right-side drawer, same accessibility guarantees as Dialog. */
export function Drawer({ open, onOpenChange, title, description, children, footer, className }: BaseProps) {
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="fixed inset-0 z-[60] bg-black/30 animate-fade" />
        <RD.Content
          className={cn(
            "fixed right-0 top-0 z-[61] flex h-full w-full max-w-xl flex-col border-l border-border bg-surface shadow-xl animate-drawer",
            className
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <RD.Title className="font-heading text-xl font-semibold truncate">{title}</RD.Title>
              {description ? (
                <RD.Description className="mt-0.5 text-sm text-muted truncate">{description}</RD.Description>
              ) : (
                <RD.Description className="sr-only">{title}</RD.Description>
              )}
            </div>
            <RD.Close className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-text" aria-label="Close details">
              <X className="h-4 w-4" />
            </RD.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
          {footer && <div className="border-t border-border px-5 py-3">{footer}</div>}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

