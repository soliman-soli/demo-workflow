import type { Project } from "@/site.config";

export type ProjectMotif = "hr" | "dashboard" | "island" | "video";

/**
 * Quiet, abstract line-art thumbnails. Pure SVG so they theme with CSS
 * variables and need no image assets.
 */
export function ProjectThumb({ motif }: { motif: Project["motif"] | ProjectMotif }) {
  const stroke = "var(--color-muted)";
  const accent = "var(--color-accent)";
  const clay = "var(--color-highlight)";

  return (
    <svg viewBox="0 0 400 180" className="h-full w-full" role="presentation" aria-hidden="true">
      <rect width="400" height="180" fill="var(--color-surface-2)" />
      {motif === "hr" && (
        <g fill="none" strokeWidth="1.5">
          <rect x="60" y="40" width="120" height="100" rx="10" stroke={stroke} opacity="0.5" />
          <line x1="76" y1="64" x2="150" y2="64" stroke={stroke} opacity="0.5" />
          <line x1="76" y1="80" x2="135" y2="80" stroke={stroke} opacity="0.35" />
          <line x1="76" y1="96" x2="160" y2="96" stroke={stroke} opacity="0.35" />
          <path d="M180 90 H230" stroke={accent} strokeDasharray="4 4" />
          <circle cx="262" cy="90" r="30" stroke={accent} />
          <path d="M248 90 l9 9 l18 -18" stroke={accent} strokeWidth="2" />
          <circle cx="330" cy="58" r="6" fill={clay} stroke="none" opacity="0.8" />
          <circle cx="330" cy="122" r="6" fill={stroke} stroke="none" opacity="0.35" />
          <path d="M292 82 L322 60 M292 98 L322 120" stroke={stroke} opacity="0.4" />
        </g>
      )}
      {motif === "dashboard" && (
        <g fill="none" strokeWidth="1.5" stroke={stroke} opacity="0.55">
          <rect x="70" y="35" width="260" height="110" rx="8" />
          <line x1="70" y1="55" x2="330" y2="55" />
          <polyline points="90,125 130,100 165,110 205,80 245,92 285,66 310,74" stroke={accent} opacity="1" />
          <line x1="90" y1="130" x2="310" y2="130" opacity="0.5" />
        </g>
      )}
      {motif === "island" && (
        <g fill="none" strokeWidth="1.5">
          <path d="M200 50 L290 95 L200 140 L110 95 Z" stroke={stroke} opacity="0.55" />
          <path d="M110 95 L110 110 L200 155 L290 110 L290 95" stroke={stroke} opacity="0.35" />
          <path d="M200 70 L240 90 L200 110 L160 90 Z" stroke={accent} />
          <circle cx="230" cy="78" r="5" fill={clay} stroke="none" opacity="0.8" />
        </g>
      )}
      {motif === "video" && (
        <g fill="none" strokeWidth="1.5">
          <rect x="80" y="50" width="70" height="80" rx="6" stroke={stroke} opacity="0.45" />
          <rect x="165" y="50" width="70" height="80" rx="6" stroke={stroke} opacity="0.6" />
          <rect x="250" y="50" width="70" height="80" rx="6" stroke={accent} />
          <path d="M276 76 L298 90 L276 104 Z" stroke={accent} />
        </g>
      )}
    </svg>
  );
}

