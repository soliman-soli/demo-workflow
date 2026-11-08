import { siteConfig } from "@/site.config";

export function Footer() {
  return (
    <footer className="no-print border-t border-border">
      <div className="mx-auto flex max-w-[1120px] flex-col items-start justify-between gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:px-6">
        <p>
          {siteConfig.name} · {siteConfig.footerNote}
        </p>
        <div className="flex gap-5">
          <a href={siteConfig.contact.github} target="_blank" rel="noopener noreferrer" className="hover:text-text">
            GitHub
          </a>
          <a href={siteConfig.contact.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-text">
            LinkedIn
          </a>
          <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-text">
            Email
          </a>
        </div>
      </div>
    </footer>
  );
}
