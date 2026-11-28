"use client";

import { m } from "motion/react";
import { Prism } from "@/components/prism";

// Luminous light-green highlights (#B8F5C8 -> #7EE2A0) with deep forest shadow (#194D30)
const PRISM_COLORS = ["#B8F5C8", "#7EE2A0", "#3B9E64", "#194D30"];

/**
 * Full-bleed WebGL2 volumetric Prism backdrop tuned to a clean, luminous
 * light green with soft glow, thin bright edges, restrained green bloom,
 * slow continuous idle motion, and gentle eased pointer response.
 */
export function HeroPrismBg() {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Restrained ambient green bloom behind the prism */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 52% 48% at 56% 42%, rgba(126, 226, 160, 0.11) 0%, rgba(36, 89, 58, 0.06) 45%, transparent 78%)",
        }}
      />

      <div className="h-full w-full opacity-65">
        <Prism
          animationType="rotate"
          timeScale={0.2}
          height={3.6}
          baseWidth={5.6}
          scale={3.4}
          colorFrequency={0.8}
          glow={0.85}
          saturation={1.08}
          noise={0.025}
          interactive
          hoverStrength={0.85}
          inertia={0.038}
          resolution={0.5}
          lightMode={false}
          colors={PRISM_COLORS}
        />
      </div>

      {/* Smooth radial & edge vignette so foreground copy stays effortlessly legible */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 78% 64% at 52% 42%, transparent 18%, var(--color-bg) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-44"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, var(--color-bg) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-20"
        style={{
          background:
            "linear-gradient(to top, transparent 0%, var(--color-bg) 100%)",
        }}
      />
    </m.div>
  );
}
