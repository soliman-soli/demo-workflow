import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/site.config";

export function Footer() {
  return (
    <footer className="no-print border-t border-border">
      <div className="mx-auto flex max-w-[1120px] flex-col items-start justify-between gap-4 px-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-3">
          <span className="font-medium text-text">{siteConfig.name}</span>
          <span className="text-border" aria-hidden>
            /
          </span>
          <span className="font-mono text-xs text-muted">
            Next.js · TypeScript · n8n
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a
            href={siteConfig.contact.github}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1 transition-colors duration-200 hover:text-accent"
          >
            <span>GitHub</span>
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={1.5}
              aria-hidden
            />
          </a>
          <a
            href={siteConfig.contact.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1 transition-colors duration-200 hover:text-accent"
          >
            <span>LinkedIn</span>
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={1.5}
              aria-hidden
            />
          </a>
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className="transition-colors duration-200 hover:text-accent"
          >
            Email
          </a>
        </div>
      </div>
    </footer>
  );
}
