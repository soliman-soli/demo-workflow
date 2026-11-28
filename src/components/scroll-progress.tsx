"use client";

import { m, useScroll, useSpring } from "motion/react";

/**
 * Thin top scroll-progress line in the luminous light-green accent.
 * Uses GPU-only scaleX transform for 60fps performance.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 32,
    restDelta: 0.001,
  });

  return (
    <m.div
      style={{ scaleX }}
      className="no-print pointer-events-none fixed inset-x-0 top-0 z-[80] h-[2px] origin-left bg-accent/90"
      aria-hidden="true"
    />
  );
}
