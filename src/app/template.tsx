"use client";

import { m } from "motion/react";
import type { ReactNode } from "react";

/**
 * Smooth cross-fade with a subtle vertical settle between App Router pages,
 * including into and out of project case-study routes.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}
