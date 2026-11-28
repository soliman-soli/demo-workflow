import type { Project } from "@/site.config";

export type ProjectMotif =
  | "hr"
  | "pharmacy"
  | "cafe"
  | "study"
  | "dashboard"
  | "island"
  | "video";

/**
 * Quiet, abstract line-art thumbnails. Pure SVG so they theme with CSS
 * variables and need no image assets.
 */
export function ProjectThumb({
  motif,
}: {
  motif: Project["motif"] | ProjectMotif;
}) {
  const stroke = "var(--color-muted)";
  const accent = "var(--color-accent)";
  const clay = "var(--color-highlight)";

  return (
    <svg
      viewBox="0 0 400 180"
      className="h-full w-full"
      role="presentation"
      aria-hidden="true"
    >
      <rect width="400" height="180" fill="var(--color-surface-2)" />
      {motif === "hr" && (
        <g fill="none" strokeWidth="1.5">
          <rect
            x="60"
            y="40"
            width="120"
            height="100"
            rx="10"
            stroke={stroke}
            opacity="0.5"
          />
          <line
            x1="76"
            y1="64"
            x2="150"
            y2="64"
            stroke={stroke}
            opacity="0.5"
          />
          <line
            x1="76"
            y1="80"
            x2="135"
            y2="80"
            stroke={stroke}
            opacity="0.35"
          />
          <line
            x1="76"
            y1="96"
            x2="160"
            y2="96"
            stroke={stroke}
            opacity="0.35"
          />
          <path d="M180 90 H230" stroke={accent} strokeDasharray="4 4" />
          <circle cx="262" cy="90" r="30" stroke={accent} />
          <path d="M248 90 l9 9 l18 -18" stroke={accent} strokeWidth="2" />
          <circle
            cx="330"
            cy="58"
            r="6"
            fill={clay}
            stroke="none"
            opacity="0.8"
          />
          <circle
            cx="330"
            cy="122"
            r="6"
            fill={stroke}
            stroke="none"
            opacity="0.35"
          />
          <path
            d="M292 82 L322 60 M292 98 L322 120"
            stroke={stroke}
            opacity="0.4"
          />
        </g>
      )}
      {motif === "pharmacy" && (
        <g fill="none" strokeWidth="1.5">
          {/* WhatsApp-style request card */}
          <rect
            x="52"
            y="42"
            width="112"
            height="96"
            rx="10"
            stroke={stroke}
            opacity="0.5"
          />
          <path d="M108 62 v24 M96 74 h24" stroke={accent} strokeWidth="2" />
          <line
            x1="72"
            y1="104"
            x2="144"
            y2="104"
            stroke={stroke}
            opacity="0.4"
          />
          <line
            x1="84"
            y1="118"
            x2="132"
            y2="118"
            stroke={stroke}
            opacity="0.3"
          />
          {/* Routing split */}
          <path d="M164 90 H208" stroke={accent} strokeDasharray="4 4" />
          <circle cx="222" cy="90" r="14" stroke={accent} />
          <path
            d="M236 82 L286 58 M236 98 L286 122"
            stroke={stroke}
            opacity="0.45"
          />
          {/* Auto-reserve node */}
          <rect x="286" y="40" width="64" height="36" rx="8" stroke={accent} />
          <path d="M308 58 l6 6 l12 -12" stroke={accent} strokeWidth="2" />
          {/* Pharmacist Telegram review node */}
          <rect
            x="286"
            y="104"
            width="64"
            height="36"
            rx="8"
            stroke={clay}
            opacity="0.85"
          />
          <circle
            cx="304"
            cy="122"
            r="5"
            fill={clay}
            stroke="none"
            opacity="0.85"
          />
          <line
            x1="316"
            y1="122"
            x2="338"
            y2="122"
            stroke={stroke}
            opacity="0.55"
          />
        </g>
      )}
      {motif === "cafe" && (
        <g fill="none" strokeWidth="1.5">
          {/* Coffee cup */}
          <path d="M92 78 h56 v30 a28 28 0 0 1 -56 0 z" stroke={accent} />
          <path d="M148 86 h10 a10 10 0 0 1 0 20 h-10" stroke={accent} />
          <line
            x1="82"
            y1="142"
            x2="158"
            y2="142"
            stroke={stroke}
            opacity="0.5"
          />
          {/* Steam arcs */}
          <path d="M108 66 c-4 -8 4 -14 0 -22" stroke={stroke} opacity="0.45" />
          <path d="M124 64 c-4 -8 4 -14 0 -22" stroke={stroke} opacity="0.45" />
          {/* Flow connector */}
          <path d="M174 96 H226" stroke={accent} strokeDasharray="4 4" />
          {/* DM confirmation bubble */}
          <rect
            x="234"
            y="64"
            width="106"
            height="64"
            rx="12"
            stroke={stroke}
            opacity="0.55"
          />
          <line
            x1="250"
            y1="86"
            x2="318"
            y2="86"
            stroke={stroke}
            opacity="0.5"
          />
          <line
            x1="250"
            y1="102"
            x2="296"
            y2="102"
            stroke={stroke}
            opacity="0.35"
          />
          <circle
            cx="322"
            cy="108"
            r="7"
            fill={clay}
            stroke="none"
            opacity="0.85"
          />
        </g>
      )}
      {motif === "study" && (
        <g fill="none" strokeWidth="1.5">
          {/* Lecture document / PDF */}
          <rect
            x="56"
            y="42"
            width="94"
            height="96"
            rx="10"
            stroke={stroke}
            opacity="0.5"
          />
          <line
            x1="72"
            y1="66"
            x2="120"
            y2="66"
            stroke={stroke}
            opacity="0.5"
          />
          <line
            x1="72"
            y1="82"
            x2="134"
            y2="82"
            stroke={stroke}
            opacity="0.35"
          />
          <line
            x1="72"
            y1="98"
            x2="118"
            y2="98"
            stroke={stroke}
            opacity="0.35"
          />
          <line
            x1="72"
            y1="114"
            x2="128"
            y2="114"
            stroke={stroke}
            opacity="0.25"
          />
          <circle
            cx="132"
            cy="60"
            r="4"
            fill={clay}
            stroke="none"
            opacity="0.85"
          />
          {/* Validation check node */}
          <path d="M150 90 H188" stroke={accent} strokeDasharray="4 4" />
          <circle cx="204" cy="90" r="16" stroke={accent} />
          <path d="M197 90 l5 5 l10 -10" stroke={accent} strokeWidth="2" />
          <path d="M220 90 H244" stroke={stroke} opacity="0.45" />
          {/* 4-box Leitner spaced-repetition progression */}
          <rect
            x="250"
            y="106"
            width="20"
            height="32"
            rx="4"
            stroke={clay}
            opacity="0.85"
          />
          <circle
            cx="260"
            cy="96"
            r="4"
            fill={clay}
            stroke="none"
            opacity="0.85"
          />
          <rect
            x="278"
            y="88"
            width="20"
            height="50"
            rx="4"
            stroke={stroke}
            opacity="0.5"
          />
          <rect
            x="306"
            y="70"
            width="20"
            height="68"
            rx="4"
            stroke={stroke}
            opacity="0.5"
          />
          <rect x="334" y="50" width="20" height="88" rx="4" stroke={accent} />
          <path
            d="M260 88 Q298 34 344 42"
            stroke={accent}
            strokeDasharray="3 3"
            opacity="0.85"
          />
          <line
            x1="244"
            y1="142"
            x2="360"
            y2="142"
            stroke={stroke}
            opacity="0.35"
          />
        </g>
      )}
      {motif === "dashboard" && (
        <g fill="none" strokeWidth="1.5" stroke={stroke} opacity="0.55">
          <rect x="70" y="35" width="260" height="110" rx="8" />
          <line x1="70" y1="55" x2="330" y2="55" />
          <polyline
            points="90,125 130,100 165,110 205,80 245,92 285,66 310,74"
            stroke={accent}
            opacity="1"
          />
          <line x1="90" y1="130" x2="310" y2="130" opacity="0.5" />
        </g>
      )}
      {motif === "island" && (
        <g fill="none" strokeWidth="1.5">
          <path
            d="M200 50 L290 95 L200 140 L110 95 Z"
            stroke={stroke}
            opacity="0.55"
          />
          <path
            d="M110 95 L110 110 L200 155 L290 110 L290 95"
            stroke={stroke}
            opacity="0.35"
          />
          <path d="M200 70 L240 90 L200 110 L160 90 Z" stroke={accent} />
          <circle
            cx="230"
            cy="78"
            r="5"
            fill={clay}
            stroke="none"
            opacity="0.8"
          />
        </g>
      )}
      {motif === "video" && (
        <g fill="none" strokeWidth="1.5">
          <rect
            x="80"
            y="50"
            width="70"
            height="80"
            rx="6"
            stroke={stroke}
            opacity="0.45"
          />
          <rect
            x="165"
            y="50"
            width="70"
            height="80"
            rx="6"
            stroke={stroke}
            opacity="0.6"
          />
          <rect x="250" y="50" width="70" height="80" rx="6" stroke={accent} />
          <path d="M276 76 L298 90 L276 104 Z" stroke={accent} />
        </g>
      )}
    </svg>
  );
}
