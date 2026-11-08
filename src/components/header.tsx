"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { siteConfig } from "@/site.config";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { label: "Projects", href: "/#projects" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="no-print sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-heading text-xl font-semibold tracking-tight hover:text-accent transition-colors">
          {siteConfig.name}
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-muted transition-colors hover:text-text">
              {l.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-btn)] border border-border bg-surface"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-border bg-bg px-4 py-2 md:hidden" aria-label="Mobile">
          <ul>
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className="block py-2.5 text-sm text-muted hover:text-text">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
