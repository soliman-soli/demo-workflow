import { siteConfig } from "@/site.config";

export function Footer() {
  return (
    <footer className="no-print border-t border-border">
      <div className="mx-auto flex max-w-[1120px] flex-col items-start justify-between gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-3">
          <span className="font-medium text-text">{siteConfig.name}</span>
          <span className="text-border" aria-hidden>
            /
          </span>
          <span className="font-mono text-xs text-muted">
            Next.js · TypeScript · n8n
          </span>
        </div>
        <div className="flex items-center gap-5">
          <a
            href={siteConfig.contact.github}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-text"
          >
            GitHub
          </a>
          <a
            href={siteConfig.contact.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-text"
          >
            LinkedIn
          </a>
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className="transition-colors hover:text-text"
          >
            Email
          </a>
        </div>
      </div>
    </footer>
  );
}
