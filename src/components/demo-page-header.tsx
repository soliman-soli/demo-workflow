import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

/** Header used by the demo sub-pages (Ask, Coach, Apply, HR). */
export function DemoPageHeader({
  label,
  title,
  description,
  actions,
  backHref = "/projects/hr-system",
  backLabel = "HR Demo",
}: {
  label: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="no-print mb-8">
      <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
        <ChevronLeft className="h-4 w-4" aria-hidden /> {backLabel}
      </Link>
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label-caps">{label}</p>
          <h1 className="mt-2 text-3xl font-medium sm:text-4xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

