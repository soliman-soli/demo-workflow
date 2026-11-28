"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronRight, Menu, X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { siteConfig } from "@/site.config";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { label: "Projects", href: "/#projects", matchPrefix: "/projects" },
  { label: "About", href: "/#about", matchPrefix: null },
  { label: "Contact", href: "/#contact", matchPrefix: null },
] as const;

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const hasResume = Boolean(siteConfig.contact.resumeUrl);

  return (
    <header className="no-print sticky top-0 z-50 border-b border-border/80 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand mark */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 font-heading text-[16px] font-semibold tracking-tight text-text transition-colors hover:text-accent"
        >
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent text-accent-contrast transition-transform duration-150 group-hover:scale-105"
            aria-hidden
          >
            <ChevronRight className="h-4 w-4 stroke-[2.5]" />
          </span>
          <span>{siteConfig.name}</span>
        </Link>

        {/* Centered nav links */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Main"
          onMouseLeave={() => setHovered(null)}
        >
          {navLinks.map((l) => {
            const isActive =
              l.matchPrefix !== null && pathname.startsWith(l.matchPrefix);
            const showIndicator =
              hovered === l.href || (hovered === null && isActive);
            return (
              <Link
                key={l.href}
                href={l.href}
                onMouseEnter={() => setHovered(l.href)}
                className="relative px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-text"
              >
                {showIndicator ? (
                  <m.span
                    layoutId="header-nav-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 -z-10 rounded-[var(--radius-btn)] bg-surface-2"
                  />
                ) : null}
                <span className={isActive ? "text-text" : undefined}>
                  {l.label}
                </span>
              </Link>
            );
          })}
          {hasResume ? (
            <a
              href={siteConfig.contact.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-text"
            >
              Resume
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          ) : null}
        </nav>

        {/* Right telemetry pill + lime CTA + theme toggle */}
        <div className="hidden items-center gap-2.5 md:flex">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/80 px-2.5 py-1 font-mono text-[11px] text-muted"
            title="All 4 n8n portfolio systems are live"
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-accent"
              aria-hidden
            />
            all systems live
          </span>
          <Link
            href="/#contact"
            className="inline-flex h-8 items-center justify-center rounded-full bg-accent px-3.5 text-xs font-semibold text-accent-contrast transition-colors hover:bg-accent-hover"
          >
            Get in touch
          </Link>
          <ThemeToggle />
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-btn)] border border-border bg-surface text-text transition-colors hover:bg-surface-2 cursor-pointer"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? (
              <X className="h-4 w-4" aria-hidden />
            ) : (
              <Menu className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <m.nav
            id="mobile-nav"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-border bg-bg px-4 py-3 md:hidden"
            aria-label="Mobile"
          >
            <ul className="space-y-1">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-[var(--radius-btn)] px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-text"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              {hasResume ? (
                <li>
                  <a
                    href={siteConfig.contact.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-[var(--radius-btn)] px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-text"
                  >
                    <span>Resume</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </li>
              ) : null}
            </ul>
          </m.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
