"use client";

import Link from "next/link";
import { useRef, type PointerEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ProjectThumb } from "@/components/project-thumb";
import { cn } from "@/lib/utils";
import type { Project } from "@/site.config";

const PROJECT_TYPE: Record<string, string> = {
  "hr-system": "AI hiring & HR pipeline",
  "pharmacy-system": "WhatsApp prescription routing",
  "fenjan-cafe": "Multilingual DM order bot",
  mozakra: "AI study pack & Leitner quiz",
};

const MAX_VISIBLE_TAGS = 5;

function SpotlightCard({
  project,
  offsetY,
}: {
  project: Project;
  offsetY?: ReturnType<typeof useTransform<number, number>>;
}) {
  const cardRef = useRef<HTMLAnchorElement | null>(null);
  const live = project.status === "live" && Boolean(project.slug);
  const visibleTags = project.tags.slice(0, MAX_VISIBLE_TAGS);
  const extraCount = project.tags.length - visibleTags.length;
  const projectType = PROJECT_TYPE[project.slug] ?? "Live automation system";

  const onPointerMove = (e: PointerEvent<HTMLAnchorElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  };

  const inner = (
    <>
      {/* Cursor-following subtle green spotlight */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(340px circle at var(--spot-x, 50%) var(--spot-y, 0%), rgba(154, 235, 178, 0.09), transparent 72%)",
        }}
        aria-hidden="true"
      />

      {/* Visual top preview area — scales gently and slows down on hover */}
      <div className="relative aspect-[20/9] overflow-hidden border-b border-border/90 bg-surface-2/60">
        <div className="h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]">
          <ProjectThumb motif={project.motif} />
        </div>
      </div>

      {/* Card body */}
      <div className="relative z-20 flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-[-0.025em] text-text sm:text-xl">
            {project.title}
          </h3>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-accent">
            <span
              className="animate-live-pulse h-1.5 w-1.5 rounded-full bg-accent"
              aria-hidden
            />
            Live demo
          </span>
        </div>

        <p className="mt-2.5 max-w-[65ch] text-sm leading-relaxed text-muted">
          {project.description}
        </p>

        {/* Calm key-value metadata table (inspired by Rootline project entries) */}
        <dl className="mt-5 divide-y divide-border/70 border-y border-border/70 text-xs">
          <div className="grid grid-cols-[72px_1fr] items-baseline gap-3 py-2.5">
            <dt className="font-mono text-[11px] text-muted">Type</dt>
            <dd className="text-text/90">{projectType}</dd>
          </div>
          <div className="grid grid-cols-[72px_1fr] items-baseline gap-3 py-2.5">
            <dt className="font-mono text-[11px] text-muted">Status</dt>
            <dd className="font-mono text-[11px] text-accent">
              Connected to live n8n workflow
            </dd>
          </div>
          <div className="grid grid-cols-[72px_1fr] items-start gap-3 py-2.5">
            <dt className="pt-0.5 font-mono text-[11px] text-muted">Stack</dt>
            <dd className="flex flex-wrap gap-1">
              {visibleTags.map((t) => (
                <span
                  key={t}
                  className="rounded border border-border/80 bg-surface-2/70 px-1.5 py-0.5 font-mono text-[10px] text-muted"
                >
                  {t}
                </span>
              ))}
              {extraCount > 0 ? (
                <span className="rounded border border-border/80 bg-surface-2/70 px-1.5 py-0.5 font-mono text-[10px] text-muted">
                  +{extraCount}
                </span>
              ) : null}
            </dd>
          </div>
        </dl>

        {/* Footer CTA */}
        <div className="mt-auto pt-4">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
            Open case study and demo
            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1 group-hover:-translate-y-0.5"
              strokeWidth={1.5}
              aria-hidden
            />
          </span>
        </div>
      </div>
    </>
  );

  return (
    <m.li style={offsetY ? { y: offsetY } : undefined} className="h-full">
      {live ? (
        <Link
          ref={cardRef}
          href={`/projects/${project.slug}`}
          onPointerMove={onPointerMove}
          className={cn(
            "surface-card group relative flex h-full flex-col overflow-hidden",
            "transition-[transform,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "hover:-translate-y-1 hover:border-accent/40 focus-visible:-translate-y-1 focus-visible:border-accent/60"
          )}
        >
          {inner}
        </Link>
      ) : (
        <article className="surface-card relative flex h-full flex-col overflow-hidden opacity-90">
          {inner}
        </article>
      )}
    </m.li>
  );
}

/**
 * Projects grid with one subtle scroll-driven parallax shift on the right column
 * (automatically disabled under prefers-reduced-motion).
 */
export function ProjectsShowcase({ projects }: { projects: readonly Project[] }) {
  const sectionRef = useRef<HTMLUListElement | null>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const rightColumnShift = useTransform(scrollYProgress, [0, 1], [14, -14]);

  return (
    <ul
      ref={sectionRef}
      className={cn(
        "grid gap-6 md:gap-7",
        projects.length > 1 ? "grid-cols-1 md:grid-cols-2" : "max-w-2xl"
      )}
    >
      {projects.map((p, idx) => (
        <SpotlightCard
          key={p.slug}
          project={p}
          offsetY={!reduced && idx % 2 === 1 ? rightColumnShift : undefined}
        />
      ))}
    </ul>
  );
}
