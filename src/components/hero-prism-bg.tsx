"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Prism } from "@/components/prism";

const subscribe = () => () => {};

const DARK_COLORS = ["#C8F542", "#4ADE80", "#38BDF8", "#84CC16"];
const LIGHT_COLORS = ["#4D7C0F", "#0F766E", "#0284C7"];

/**
 * Full-bleed WebGL2 volumetric Prism backdrop tuned to the obsidian + lime
 * reference aesthetic (and calibrated to crisp colored ink in Light mode).
 */
export function HeroPrismBg() {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  const isLight = mounted && resolvedTheme === "light";

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <div className={isLight ? "h-full w-full opacity-25" : "h-full w-full opacity-65"}>
        <Prism
          animationType="rotate"
          timeScale={0.28}
          height={3.6}
          baseWidth={5.8}
          scale={3.4}
          colorFrequency={0.85}
          glow={isLight ? 0.75 : 0.88}
          saturation={isLight ? 1.1 : 1.25}
          noise={0.04}
          hoverStrength={1.2}
          inertia={0.04}
          resolution={0.5}
          lightMode={isLight}
          colors={isLight ? LIGHT_COLORS : DARK_COLORS}
        />
      </div>
      {/* Smooth radial & edge vignette so foreground typography stays razor sharp */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 65% at 50% 40%, transparent 15%, var(--color-bg) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-40"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, var(--color-bg) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-24"
        style={{
          background:
            "linear-gradient(to top, transparent 0%, var(--color-bg) 100%)",
        }}
      />
    </div>
  );
}
