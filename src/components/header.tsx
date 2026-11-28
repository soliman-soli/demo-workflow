"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { siteConfig } from "@/site.config";
import { EDITORIAL_EASE } from "@/components/motion-primitives";

const navLinks = [
  { label: "Projects", href: "/#projects", sectionId: "projects", matchPrefix: "/projects" },
  { label: "About", href: "/#about", sectionId: "about", matchPrefix: null },
  { label: "Contact", href: "/#contact", sectionId: "contact", matchPrefix: null },
] as const;

export function Header() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Track visible homepage section for sliding active indicator
  useEffect(() => {
    if (pathname !== "/") return undefined;
    const ids = ["projects", "about", "contact"];
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0.1, 0.3, 0.6] }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const hasResume = Boolean(siteConfig.contact.resumeUrl);

  return (
    <>
      <header className="no-print sticky top-0 z-50 border-b border-border/80 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between gap-4 px-4 sm:px-6">
          {/* Brand mark */}
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 font-heading text-[16px] font-semibold tracking-tight text-text transition-colors duration-200 hover:text-accent"
          >
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 border border-accent/35 text-accent transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              aria-hidden
            >
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
            <span>{siteConfig.name}</span>
          </Link>

          {/* Centered nav links with sliding active/hover indicator */}
          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Main"
            onMouseLeave={() => setHovered(null)}
          >
            {navLinks.map((l) => {
              const isRouteActive =
                l.matchPrefix !== null && pathname.startsWith(l.matchPrefix);
              const isSectionActive =
                pathname === "/" && activeSection === l.sectionId;
              const isActive = isRouteActive || isSectionActive;
              const showIndicator =
                hovered === l.href || (hovered === null && isActive);

              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onMouseEnter={() => setHovered(l.href)}
                  className="relative px-3.5 py-1.5 text-sm font-medium text-muted transition-colors duration-200 hover:text-text"
                >
                  {showIndicator ? (
                    <m.span
                      layoutId="header-nav-indicator"
                      transition={{ duration: 0.28, ease: EDITORIAL_EASE }}
                      className="absolute inset-0 -z-10 rounded-[var(--radius-btn)] border border-accent/25 bg-accent/10"
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
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted transition-colors duration-200 hover:text-text"
              >
                Resume
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              </a>
            ) : null}
          </nav>

          {/* Right status pill + soft green CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <span
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-2.5 py-1 font-mono text-[11px] text-muted"
              title="Open to AI automation, backend, and full-stack roles"
            >
              <span
                className="animate-live-pulse h-1.5 w-1.5 rounded-full bg-accent"
                aria-hidden
              />
              open to roles
            </span>
            <Link
              href="/#contact"
              className="inline-flex h-9 items-center justify-center rounded-[var(--radius-btn)] bg-accent px-4 text-xs font-semibold text-accent-contrast transition-colors duration-200 hover:bg-accent-hover"
            >
              Get in touch
            </Link>
          </div>

          {/* Mobile menu pill trigger */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-9 items-center gap-2.5 rounded-full border border-border bg-surface px-3.5 text-xs font-medium text-text transition-colors duration-200 hover:border-accent/40 md:hidden cursor-pointer"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav-overlay"
          >
            <span>{open ? "Close" : "Menu"}</span>
            <span className="relative flex h-3 w-3.5 flex-col items-center justify-center" aria-hidden>
              <span
                className={`block h-[1.5px] w-3.5 bg-current transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  open ? "translate-y-[0.75px] rotate-45" : "-translate-y-1"
                }`}
              />
              <span
                className={`block h-[1.5px] w-3.5 bg-current transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  open ? "-translate-y-[0.75px] -rotate-45" : "translate-y-1"
                }`}
              />
            </span>
          </button>
        </div>
      </header>

      {/* Full-screen dark mobile menu overlay with staggered item entrance */}
      <AnimatePresence>
        {open ? (
          <m.div
            id="mobile-nav-overlay"
            data-lenis-prevent
            initial={reduced ? { opacity: 0 } : { opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, clipPath: "inset(0 0 0% 0)" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: reduced ? 0.2 : 0.45, ease: EDITORIAL_EASE }}
            className="fixed inset-x-0 bottom-0 top-14 z-[65] flex flex-col justify-between bg-bg/98 px-6 py-10 backdrop-blur-xl md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <nav aria-label="Mobile">
              <ul className="divide-y divide-border/80 border-y border-border/80">
                {navLinks.map((l, idx) => (
                  <m.li
                    key={l.href}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
                    animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: reduced ? 0 : 0.08 + idx * 0.06,
                      ease: EDITORIAL_EASE,
                    }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between py-5 text-2xl font-medium tracking-tight text-text transition-colors duration-200 hover:text-accent"
                    >
                      <span>{l.label}</span>
                      <ArrowUpRight className="h-5 w-5 text-muted" strokeWidth={1.5} aria-hidden />
                    </Link>
                  </m.li>
                ))}
                {hasResume ? (
                  <m.li
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
                    animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: reduced ? 0 : 0.08 + navLinks.length * 0.06,
                      ease: EDITORIAL_EASE,
                    }}
                  >
                    <a
                      href={siteConfig.contact.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between py-5 text-2xl font-medium tracking-tight text-text transition-colors duration-200 hover:text-accent"
                    >
                      <span>Resume</span>
                      <ArrowUpRight className="h-5 w-5 text-muted" strokeWidth={1.5} aria-hidden />
                    </a>
                  </m.li>
                ) : null}
              </ul>
            </nav>

            <div className="space-y-4">
              <Link
                href="/#contact"
                onClick={() => setOpen(false)}
                className="flex h-11 w-full items-center justify-center rounded-[var(--radius-btn)] bg-accent text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-hover"
              >
                Get in touch
              </Link>
              <p className="font-mono text-xs text-muted">
                {siteConfig.contact.email}
              </p>
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
