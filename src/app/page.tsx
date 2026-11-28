import Link from "next/link";
import { ArrowRight, ArrowUpRight, FileText, Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/brand-icons";
import { CopyEmailButton } from "@/components/copy-email-button";
import { HeroPipeline } from "@/components/hero-pipeline";
import { HeroPrismBg } from "@/components/hero-prism-bg";
import { HeroReveal } from "@/components/hero-reveal";
import { ProjectThumb } from "@/components/project-thumb";
import { Badge, Tag } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteConfig, type Project } from "@/site.config";

const MAX_VISIBLE_TAGS = 5;

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
          {/* Hero — 12-col split */}
          <section
            className="grid grid-cols-12 items-center gap-8 pb-14 pt-14 sm:pt-20 lg:gap-10 lg:pb-16 lg:pt-24"
            aria-labelledby="hero-title"
          >
            <HeroReveal className="col-span-12 lg:col-span-7">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 font-mono text-xs text-muted backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                <span>{hero.eyebrow}</span>
              </div>
              <h1
                id="hero-title"
                className="text-[2.125rem] font-semibold leading-[1.06] tracking-[-0.03em] text-text sm:text-[2.85rem] lg:text-[3.35rem]"
              >
                {hero.headline}
              </h1>
              <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-muted sm:text-[17px]">
                {hero.sub}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="#projects"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "rounded-full px-6 font-semibold"
                  )}
                >
                  Explore live systems
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="#contact"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "rounded-full bg-surface/75 backdrop-blur-sm px-6"
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
                    <FileText className="h-4 w-4" aria-hidden />
                    Resume
                  </a>
                ) : null}
              </div>
            </HeroReveal>

            <HeroReveal delay={0.08} className="col-span-12 lg:col-span-5">
              <HeroPipeline />
            </HeroReveal>
          </section>

          {/* 3-Column Reference-Inspired Telemetry Band */}
          <section
            aria-label="Engineering metrics"
            className="border-t border-border/70 py-10 sm:py-12"
          >
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
              {/* Metric 1: Live systems + sparkline */}
              <div>
                <p className="font-mono text-xs text-muted">live systems</p>
                <p className="mt-2 font-heading text-4xl font-semibold tracking-tight text-text tabular-nums">
                  4
                </p>
                <p className="mt-1.5 text-xs text-muted">
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
                        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.28" />
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
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Metric 2: Repo analysis throughput + segmented lime meter */}
              <div>
                <p className="font-mono text-xs text-muted">rag throughput</p>
                <p className="mt-2 font-heading text-4xl font-semibold tracking-tight text-text tabular-nums">
                  30+
                </p>
                <p className="mt-1.5 text-xs text-muted">
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
                        idx < 9 ? "bg-accent" : "bg-surface-2 border border-border"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Metric 3: Deterministic guardrails + crisp lime bar */}
              <div>
                <p className="font-mono text-xs text-muted">rule validation</p>
                <p className="mt-2 font-heading text-4xl font-semibold tracking-tight text-text tabular-nums">
                  100%
                </p>
                <p className="mt-1.5 text-xs text-muted">
                  Schema &amp; business-rule checks before every live action
                </p>
                <div
                  className="mt-6 h-2 w-full max-w-[240px] overflow-hidden rounded-full bg-surface-2"
                  aria-hidden="true"
                >
                  <div className="h-full w-[96%] rounded-full bg-accent" />
                </div>
              </div>
            </div>

            {/* 3-Column Engineering Notes */}
            <div className="mt-10 grid grid-cols-1 gap-6 border-t border-border/70 pt-8 md:grid-cols-3 md:gap-8">
              {SYSTEM_NOTES.map((note) => (
                <div key={note.role} className="space-y-2.5">
                  <p className="text-xs leading-relaxed text-text/90">
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
        </div>
      </div>

      {/* Main Content Container */}
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
        {/* Projects — Balanced 2x2 architectural grid */}
        <section
          id="projects"
          className="py-16 md:py-20"
          aria-labelledby="projects-title"
        >
          <div className="mb-10 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="inline-flex items-center gap-1.5 font-mono text-xs text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                selected work
              </p>
              <h2
                id="projects-title"
                className="mt-1.5 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl"
              >
                Live systems &amp; case studies
              </h2>
            </div>
            <p className="text-sm text-muted">
              Every project below connects to a real n8n workflow.
            </p>
          </div>

          <ul
            className={cn(
              "grid gap-6",
              projects.length > 1 ? "grid-cols-1 md:grid-cols-2" : "max-w-2xl"
            )}
          >
            {projects.map((p) => (
              <li key={p.slug}>
                <ProjectCard project={p} />
              </li>
            ))}
          </ul>
        </section>

        {/* About & Capabilities Matrix */}
        <section
          id="about"
          className="grid grid-cols-12 gap-8 border-t border-border py-16 md:py-20"
          aria-labelledby="about-title"
        >
          <div className="col-span-12 md:col-span-4">
            <p className="inline-flex items-center gap-1.5 font-mono text-xs text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              background
            </p>
            <h2
              id="about-title"
              className="mt-1.5 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl"
            >
              About &amp; capabilities
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Focused on reliable AI workflows where LLMs handle reasoning and
              deterministic code enforces business rules.
            </p>
          </div>

          <div className="col-span-12 md:col-span-8">
            <p className="max-w-[65ch] text-base leading-relaxed text-muted">
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
          </div>
        </section>

        {/* Contact Rail */}
        <section
          id="contact"
          className="grid grid-cols-12 gap-8 border-t border-border py-16 md:py-20"
          aria-labelledby="contact-title"
        >
          <div className="col-span-12 md:col-span-4">
            <p className="inline-flex items-center gap-1.5 font-mono text-xs text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              contact
            </p>
            <h2
              id="contact-title"
              className="mt-1.5 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl"
            >
              Let&apos;s build something real
            </h2>
          </div>

          <div className="col-span-12 md:col-span-8">
            <p className="max-w-[58ch] text-base leading-relaxed text-muted">
              {contact.blurb}
            </p>
            <ul className="mt-8 divide-y divide-border border-y border-border">
              <li className="flex flex-wrap items-center justify-between gap-3 py-4">
                <a
                  href={`mailto:${contact.email}`}
                  className="group flex min-w-0 flex-1 items-center gap-4 transition-colors hover:text-accent"
                >
                  <span
                    className="text-muted transition-colors group-hover:text-accent"
                    aria-hidden
                  >
                    <Mail className="h-4 w-4" />
                  </span>
                  <span className="w-20 shrink-0 text-sm text-muted">Email</span>
                  <span className="truncate font-mono text-sm font-medium text-text group-hover:text-accent">
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
                  icon={<FileText className="h-4 w-4" />}
                  label="Resume"
                  value="View PDF resume"
                  href={contact.resumeUrl}
                  external
                />
              ) : null}
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const live = project.status === "live" && Boolean(project.slug);
  const visibleTags = project.tags.slice(0, MAX_VISIBLE_TAGS);
  const extraCount = project.tags.length - visibleTags.length;

  const inner = (
    <>
      <div className="relative aspect-[20/9] overflow-hidden border-b border-border">
        <ProjectThumb motif={project.motif} />
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-[-0.02em] text-text sm:text-xl">
            {project.title}
          </h3>
          {live ? (
            <Badge tone="accent">
              <span
                className="h-1.5 w-1.5 rounded-full bg-accent"
                aria-hidden
              />
              Live
            </Badge>
          ) : (
            <Badge tone="neutral">In progress</Badge>
          )}
        </div>
        <p className="mt-2.5 text-sm leading-relaxed text-muted">
          {project.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {visibleTags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
          {extraCount > 0 ? <Tag>+{extraCount}</Tag> : null}
        </div>
        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between border-t border-border/70 pt-4 text-sm">
            {live ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-accent">
                Open case study &amp; demo
                <ArrowUpRight
                  className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </span>
            ) : (
              <span className="text-muted">Case study coming soon</span>
            )}
          </div>
        </div>
      </div>
    </>
  );

  const base = "surface-card flex h-full flex-col overflow-hidden";

  if (live) {
    return (
      <Link
        href={`/projects/${project.slug}`}
        className={cn(
          base,
          "group transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/55 hover:shadow-[0_10px_30px_-18px_rgba(200,245,66,0.22)] focus-visible:-translate-y-0.5"
        )}
      >
        {inner}
      </Link>
    );
  }

  return (
    <article
      className={cn(base, "opacity-95")}
      aria-label={`${project.title} (in progress)`}
    >
      {inner}
    </article>
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
        className="group flex items-center gap-4 py-4 transition-colors hover:text-accent"
      >
        <span
          className="text-muted transition-colors group-hover:text-accent"
          aria-hidden
        >
          {icon}
        </span>
        <span className="w-20 shrink-0 text-sm text-muted">{label}</span>
        <span className="flex-1 truncate font-mono text-sm font-medium text-text group-hover:text-accent">
          {value}
        </span>
        <ArrowUpRight
          className="h-4 w-4 text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
          aria-hidden
        />
      </a>
    </li>
  );
}
