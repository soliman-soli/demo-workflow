"use client";

import { m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { EDITORIAL_EASE } from "@/components/motion-primitives";

export function HeroReveal({
  children,
  delay = 0,
  y = 10,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <m.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{
        duration: reduced ? 0.25 : 0.7,
        delay: reduced ? 0 : delay,
        ease: EDITORIAL_EASE,
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}
