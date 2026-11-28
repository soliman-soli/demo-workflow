import Link from "next/link";
import { ArrowRight, ArrowUpRight, FileText, Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/brand-icons";
import { CopyEmailButton } from "@/components/copy-email-button";
import { HeroPipeline } from "@/components/hero-pipeline";
import { HeroPrismBg } from "@/components/hero-prism-bg";
import { HeroReveal } from "@/components/hero-reveal";
import { FadeInPlace, MaskedHeading } from "@/components/motion-primitives";
import { ProjectsShowcase } from "@/components/projects-showcase";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/site.config";

const SYSTEM_NOTES = [
  {
    quote:
      "Every AI demo runs against live n8n webhooks — no fake replies, no hardcoded prices, no simulated backends.",
    role: "Live-first architecture",
    scope: "HR · Pharmacy · Café · Mozakra",
  },
  {
    quote:
      "LLMs handle extraction, language, and drafting; deterministic code and Google Sheets enforce rules, pricing, and safety.",
    role: "Hybrid AI + rules",
    scope: "Gemini · TypeScript · Zod",
  },
  {
    quote:
      "When an order needs a pharmacist, a café needs a human, or a CV needs review, Telegram alerts hand off with full context.",
    role: "Human-in-the-loop",
    scope: "Telegram · WhatsApp · Gmail",
  },
] as const;

export default function HomePage() {
  const { hero, about, contact, projects } = siteConfig;
  const hasResume = Boolean(contact.resumeUrl);

  return (
    <>
      {/* Full-bleed WebGL2 Prism Canvas — Hero + Telemetry Band */}
      <div className="relative isolate overflow-hidden border-b border-border/80">
        <HeroPrismBg />

        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          {/* Hero — Orchestrated load sequence (headline -> sub -> CTAs -> prism & instrument) */}
          <section
            className="grid grid-cols-1 items-center gap-y-10 pb-16 pt-16 sm:pt-24 lg:grid-cols-12 lg:gap-12 lg:pb-24 lg:pt-28"
            aria-labelledby="hero-title"
          >
            <div className="lg:col-span-7">
              <HeroReveal delay={0} y={14}>
                <h1
                  id="hero-title"
                  className="text-[2.125rem] font-semibold leading-[1.06] tracking-[-0.032em] text-text sm:text-[2.95rem] lg:text-[3.4rem]"
                >
                  {hero.headline}
                </h1>
              </HeroReveal>

              <HeroReveal delay={0.14} y={8}>
                <p className="mt-6 max-w-[60ch] text-base leading-relaxed text-muted sm:text-[17px]">
                  {hero.sub}
                </p>
              </HeroReveal>

              <HeroReveal delay={0.24} y={6}>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Link
                    href="#projects"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "px-6 font-semibold"
                    )}
                  >
                    Explore live systems
                    <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  </Link>
                  <Link
                    href="#contact"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "bg-surface/75 px-6 backdrop-blur-sm"
                    )}
                  >
                    Get in touch
                  </Link>
                  {hasResume ? (
                    <a
                      href={contact.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({ variant: "ghost", size: "lg" })}
                    >
                      <FileText className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                      Resume
                    </a>
                  ) : null}
                </div>
              </HeroReveal>
            </div>

            <HeroReveal delay={0.34} y={10} className="lg:col-span-5">
              <HeroPipeline />
            </HeroReveal>
          </section>

          {/* 3-Column Telemetry Band */}
          <FadeInPlace>
            <section
              aria-label="Engineering metrics"
              className="border-t border-border/70 py-12 sm:py-16"
            >
              <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
                {/* Metric 1: Live systems + sparkline */}
                <div>
                  <p className="font-mono text-xs text-muted">Live systems</p>
                  <p className="mt-2 font-heading text-4xl font-semibold tracking-tight text-text tabular-nums">
                    4
                  </p>
                  <p className="mt-1.5 max-w-[32ch] text-xs leading-relaxed text-muted">
                    n8n + Gemini workflows running end to end
                  </p>
                  <div className="mt-4">
                    <svg
                      viewBox="0 0 240 44"
                      className="h-10 w-full max-w-[240px]"
                      role="presentation"
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.24" />
                          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0 36 L38 33 L74 28 L112 24 L152 17 L194 12 L240 6 L240 44 L0 44 Z"
                        fill="url(#spark-fill)"
                      />
                      <polyline
                        points="0,36 38,33 74,28 112,24 152,17 194,12 240,6"
                        fill="none"
                        stroke="var(--color-accent)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* Metric 2: Repo analysis throughput + segmented meter */}
                <div>
                  <p className="font-mono text-xs text-muted">RAG throughput</p>
                  <p className="mt-2 font-heading text-4xl font-semibold tracking-tight text-text tabular-nums">
                    30+
                  </p>
                  <p className="mt-1.5 max-w-[32ch] text-xs leading-relaxed text-muted">
                    GitHub repos analyzed into recruiter reports in &lt; 2 min
                  </p>
                  <div
                    className="mt-5 flex items-center gap-1.5"
                    aria-hidden="true"
                  >
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          "h-6 w-3 rounded-[3px]",
                          idx < 9
                            ? "bg-accent/85"
                            : "border border-border bg-surface-2"
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Metric 3: Deterministic guardrails + progress bar */}
                <div>
                  <p className="font-mono text-xs text-muted">Rule validation</p>
                  <p className="mt-2 font-heading text-4xl font-semibold tracking-tight text-text tabular-nums">
                    100%
                  </p>
                  <p className="mt-1.5 max-w-[32ch] text-xs leading-relaxed text-muted">
                    Schema &amp; business-rule checks before every live action
                  </p>
                  <div
                    className="mt-6 h-2 w-full max-w-[240px] overflow-hidden rounded-full bg-surface-2"
                    aria-hidden="true"
                  >
                    <div className="h-full w-[96%] rounded-full bg-accent/90" />
                  </div>
                </div>
              </div>

              {/* 3-Column Engineering Notes */}
              <div className="mt-12 grid grid-cols-1 gap-6 border-t border-border/70 pt-9 md:grid-cols-3 md:gap-8">
                {SYSTEM_NOTES.map((note) => (
                  <div key={note.role} className="space-y-2.5">
                    <p className="max-w-[40ch] text-xs leading-relaxed text-text/90">
                      {note.quote}
                    </p>
                    <div className="text-[11px]">
                      <p className="font-medium text-text">{note.role}</p>
                      <p className="font-mono text-muted">{note.scope}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </FadeInPlace>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
        {/* Projects — Redesigned spotlight + key-value cards with subtle scroll shift */}
        <section
          id="projects"
          className="py-20 md:py-28"
          aria-labelledby="projects-title"
        >
          <div className="mb-12 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <MaskedHeading
              id="projects-title"
              lines={["Live systems & case studies"]}
              className="text-2xl font-semibold tracking-[-0.028em] sm:text-3xl lg:text-[2.15rem]"
            />
            <FadeInPlace>
              <p className="max-w-[42ch] text-sm text-muted">
                Every project below connects to a real n8n workflow.
              </p>
            </FadeInPlace>
          </div>

          <ProjectsShowcase projects={projects} />
        </section>

        {/* About & Capabilities Matrix */}
        <section
          id="about"
          className="grid grid-cols-1 gap-y-8 border-t border-border py-20 md:grid-cols-12 md:gap-8 md:py-28"
          aria-labelledby="about-title"
        >
          <div className="md:col-span-4">
            <MaskedHeading
              id="about-title"
              lines={["About & capabilities"]}
              className="text-2xl font-semibold tracking-[-0.028em] sm:text-3xl"
            />
            <FadeInPlace>
              <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-muted">
                Focused on reliable AI workflows where LLMs handle reasoning and
                deterministic code enforces business rules.
              </p>
            </FadeInPlace>
          </div>

          <FadeInPlace className="md:col-span-8">
            <p className="max-w-[68ch] text-base leading-relaxed text-muted">
              {about.intro}
            </p>
            <dl className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {about.skills.map((s) => (
                <div key={s.group} className="border-t border-border pt-4">
                  <dt className="font-mono text-xs font-medium text-text">
                    {s.group}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted">
                    {s.items.join(" · ")}
                  </dd>
                </div>
              ))}
            </dl>
          </FadeInPlace>
        </section>

        {/* Contact Rail */}
        <section
          id="contact"
          className="grid grid-cols-1 gap-y-8 border-t border-border py-20 md:grid-cols-12 md:gap-8 md:py-28"
          aria-labelledby="contact-title"
        >
          <div className="md:col-span-4">
            <MaskedHeading
              id="contact-title"
              lines={["Let’s build something real"]}
              className="text-2xl font-semibold tracking-[-0.028em] sm:text-3xl"
            />
          </div>

          <FadeInPlace className="md:col-span-8">
            <p className="max-w-[60ch] text-base leading-relaxed text-muted">
              {contact.blurb}
            </p>
            <ul className="mt-8 divide-y divide-border border-y border-border">
              <li className="flex flex-wrap items-center justify-between gap-3 py-4">
                <a
                  href={`mailto:${contact.email}`}
                  className="group flex min-w-0 flex-1 items-center gap-4 transition-colors duration-200 hover:text-accent"
                >
                  <span
                    className="text-muted transition-[color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:text-accent"
                    aria-hidden
                  >
                    <Mail className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                  <span className="w-20 shrink-0 text-sm text-muted">Email</span>
                  <span className="truncate font-mono text-sm font-medium text-text transition-colors duration-200 group-hover:text-accent">
                    {contact.email}
                  </span>
                </a>
                <CopyEmailButton email={contact.email} />
              </li>
              <ContactRow
                icon={<GithubIcon />}
                label="GitHub"
                value={contact.github.replace(/^https?:\/\/(www\.)?/, "")}
                href={contact.github}
                external
              />
              <ContactRow
                icon={<LinkedinIcon />}
                label="LinkedIn"
                value={contact.linkedin.replace(/^https?:\/\/(www\.)?/, "")}
                href={contact.linkedin}
                external
              />
              {hasResume ? (
                <ContactRow
                  icon={<FileText className="h-4 w-4" strokeWidth={1.5} />}
                  label="Resume"
                  value="View PDF resume"
                  href={contact.resumeUrl}
                  external
                />
              ) : null}
            </ul>
          </FadeInPlace>
        </section>
      </div>
    </>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
  external,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) {
  return (
    <li>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="group flex items-center gap-4 py-4 transition-colors duration-200 hover:text-accent"
      >
        <span
          className="text-muted transition-[color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:text-accent"
          aria-hidden
        >
          {icon}
        </span>
        <span className="w-20 shrink-0 text-sm text-muted">{label}</span>
        <span className="flex-1 truncate font-mono text-sm font-medium text-text transition-colors duration-200 group-hover:text-accent">
          {value}
        </span>
        <ArrowUpRight
          className="h-4 w-4 text-muted transition-[color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
          strokeWidth={1.5}
          aria-hidden
        />
      </a>
    </li>
  );
}
