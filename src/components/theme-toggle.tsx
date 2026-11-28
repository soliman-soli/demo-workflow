"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-btn)] border border-border bg-surface text-muted transition-colors duration-150 hover:border-muted/50 hover:bg-surface-2 hover:text-text cursor-pointer"
      aria-label={
        mounted
          ? `Switch to ${isDark ? "light" : "dark"} theme`
          : "Toggle theme"
      }
    >
      {mounted ? (
        <AnimatePresence mode="wait" initial={false}>
          <m.span
            key={isDark ? "sun" : "moon"}
            initial={{ opacity: 0, rotate: -30, scale: 0.85 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 30, scale: 0.85 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center justify-center"
          >
            {isDark ? (
              <Sun className="h-4 w-4" aria-hidden />
            ) : (
              <Moon className="h-4 w-4" aria-hidden />
            )}
          </m.span>
        </AnimatePresence>
      ) : (
        <span className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
