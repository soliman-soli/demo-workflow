"use client";

import { m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export const EDITORIAL_EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Masked line-by-line reveal for section headings.
 * Reveals once, never re-triggers; falls back to simple fade under reduced motion.
 */
export function MaskedHeading({
  lines,
  as: Tag = "h2",
  id,
  className,
}: {
  lines: string[];
  as?: "h1" | "h2" | "h3";
  id?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <Tag id={id} className={className}>
      {lines.map((line, i) => (
        <span key={line} className="block overflow-hidden pb-[0.06em]">
          <m.span
            className="block"
            initial={reduced ? { opacity: 0 } : { y: "105%", opacity: 0.001 }}
            whileInView={reduced ? { opacity: 1 } : { y: "0%", opacity: 1 }}
            viewport={{ once: true, amount: "some" }}
            transition={{
              duration: reduced ? 0.25 : 0.72,
              delay: reduced ? 0 : i * 0.09,
              ease: EDITORIAL_EASE,
            }}
          >
            {line}
          </m.span>
        </span>
      ))}
    </Tag>
  );
}

/**
 * Restrained in-place reveal for body copy and supporting blocks (no vertical slide-up spam).
 * Reveals once, never re-triggers.
 */
export function FadeInPlace({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: "some" }}
      transition={{ duration: 0.65, delay, ease: EDITORIAL_EASE }}
      className={className}
    >
      {children}
    </m.div>
  );
}
