"use client";

import { useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { cn } from "@/lib/utils";

interface PipelineStage {
  id: string;
  step: string;
  label: string;
  role: string;
  project: string;
  example: string;
}

const STAGES: readonly PipelineStage[] = [
  {
    id: "trigger",
    step: "01",
    label: "Trigger",
    role: "Inbound channel or webhook",
    project: "Dawaa Pharmacy · Fenjan Café",
    example:
      "WhatsApp prescription photo, Instagram DM in Arabic/Franco, or a lecture PDF arrives via webhook.",
  },
  {
    id: "llm",
    step: "02",
    label: "LLM",
    role: "Structured extraction & generation",
    project: "Gemini · LangChain · RAG",
    example:
      "Gemini parses intent, items, and language into strict JSON — or drafts study packs and quiz questions.",
  },
  {
    id: "validate",
    step: "03",
    label: "Validator",
    role: "Deterministic code & sheet rules",
    project: "Mozakra · HR Demo",
    example:
      "Code enforces menu prices, Rx safety, CV score thresholds, and quiz answer integrity before any action.",
  },
  {
    id: "action",
    step: "04",
    label: "Action",
    role: "Live state & human handoff",
    project: "Google Sheets · Telegram · Gmail",
    example:
      "Writes live rows to Sheets, schedules spaced-repetition reviews, and pings staff on Telegram when needed.",
  },
] as const;

export function HeroPipeline() {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = STAGES[activeIndex];

  return (
    <div
      className="surface-card relative overflow-hidden"
      aria-label="Interactive workflow architecture diagram"
    >
      {/* Top instrument header */}
      <div className="flex items-center justify-between border-b border-border bg-surface-2/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full bg-accent"
            aria-hidden
          />
          <span className="font-mono text-xs font-medium text-text">
            workflow.runtime
          </span>
        </div>
        <span className="font-mono text-[11px] text-muted">
          4 live n8n pipelines
        </span>
      </div>

      {/* Schematic stage */}
      <div className="schematic-grid relative px-4 py-6 sm:px-5">
        {/* Connecting animated SVG rail (desktop/tablet) */}
        <svg
          viewBox="0 0 400 24"
          className="pointer-events-none absolute left-8 right-8 top-[3.15rem] hidden h-6 w-[calc(100%-4rem)] sm:block"
          aria-hidden="true"
        >
          <line
            x1="0"
            y1="12"
            x2="400"
            y2="12"
            stroke="var(--color-border)"
            strokeWidth="1.5"
          />
          <line
            x1="0"
            y1="12"
            x2="400"
            y2="12"
            stroke="var(--color-accent)"
            strokeWidth="1.5"
            strokeDasharray="6 18"
            className="animate-pipeline-dash"
            opacity="0.85"
          />
        </svg>

        {/* 4 interactive nodes */}
        <div
          className="relative z-10 grid grid-cols-2 gap-2.5 sm:grid-cols-4"
          role="tablist"
          aria-label="Workflow pipeline stages"
        >
          {STAGES.map((stage, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={stage.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveIndex(idx)}
                onMouseEnter={() => setActiveIndex(idx)}
                onFocus={() => setActiveIndex(idx)}
                className={cn(
                  "group relative flex flex-col items-start rounded-[var(--radius-btn)] border px-3 py-2.5 text-left transition-colors duration-150 cursor-pointer",
                  isActive
                    ? "border-accent/60 bg-surface text-text shadow-[0_2px_10px_-6px_rgba(15,118,110,0.35)]"
                    : "border-border bg-surface/90 text-muted hover:border-muted/50 hover:text-text"
                )}
              >
                <span className="flex w-full items-center justify-between font-mono text-[10px]">
                  <span className={isActive ? "text-accent" : "text-muted"}>
                    {stage.step}
                  </span>
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-colors",
                      isActive ? "bg-accent" : "bg-border group-hover:bg-muted"
                    )}
                    aria-hidden
                  />
                </span>
                <span className="mt-1.5 text-xs font-semibold tracking-tight text-text">
                  {stage.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live readout panel */}
      <div className="border-t border-border bg-surface px-4 py-3.5 sm:px-5">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={current.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-[4.25rem]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-text">
                {current.role}
              </span>
              <span className="font-mono text-[11px] text-accent">
                {current.project}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              {current.example}
            </p>
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
