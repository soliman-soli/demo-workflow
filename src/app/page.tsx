import Link from "next/link";
import { ArrowRight, ArrowUpRight, Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/brand-icons";
import { siteConfig, type Project } from "@/site.config";
import { ProjectThumb } from "@/components/project-thumb";
import { Badge, Tag } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { hero, about, contact, projects } = siteConfig;

  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
      {/* Hero */}
      <section className="grid grid-cols-12 gap-6 pb-16 pt-16 sm:pt-24 md:pb-24" aria-labelledby="hero-title">
        <div className="col-span-12 lg:col-span-9">
          <p className="label-caps mb-5">{hero.eyebrow}</p>
          <h1 id="hero-title" className="text-[2.25rem] leading-[1.1] font-medium sm:text-5xl lg:text-[4rem] lg:leading-[1.05]">
            {hero.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{hero.sub}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="#projects" className={buttonVariants({ size: "lg" })}>
              See projects <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="#contact" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Contact
            </Link>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="border-t border-border py-16 md:py-20" aria-labelledby="projects-title">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 id="projects-title" className="text-3xl font-medium">
            Projects
          </h2>
          <p className="hidden text-sm text-muted sm:block">One live demo, more on the way.</p>
        </div>
        <ul className="grid gap-6 md:grid-cols-2">
          {projects.map((p) => (
            <li key={p.title}>
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
      </section>

      {/* About */}
      <section id="about" className="grid grid-cols-12 gap-6 border-t border-border py-16 md:py-20" aria-labelledby="about-title">
        <h2 id="about-title" className="col-span-12 text-3xl font-medium md:col-span-4">
          About
        </h2>
        <div className="col-span-12 md:col-span-8">
          <p className="max-w-2xl text-base leading-relaxed text-muted">{about.intro}</p>
          <dl className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {about.skills.map((s) => (
              <div key={s.group} className="border-t border-border pt-4">
                <dt className="label-caps">{s.group}</dt>
                <dd className="mt-2 text-sm leading-relaxed">{s.items.join(" · ")}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="grid grid-cols-12 gap-6 border-t border-border py-16 md:py-20" aria-labelledby="contact-title">
        <h2 id="contact-title" className="col-span-12 text-3xl font-medium md:col-span-4">
          Contact
        </h2>
        <div className="col-span-12 md:col-span-8">
          <p className="max-w-xl text-base leading-relaxed text-muted">{contact.blurb}</p>
          <ul className="mt-8 divide-y divide-border border-y border-border">
            <ContactRow icon={<Mail className="h-4 w-4" />} label="Email" value={contact.email} href={`mailto:${contact.email}`} />
            <ContactRow icon={<GithubIcon />} label="GitHub" value={contact.github.replace(/^https?:\/\/(www\.)?/, "")} href={contact.github} external />
            <ContactRow icon={<LinkedinIcon />} label="LinkedIn" value={contact.linkedin.replace(/^https?:\/\/(www\.)?/, "")} href={contact.linkedin} external />
          </ul>
        </div>
      </section>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const live = project.status === "live" && project.slug;

  const inner = (
    <>
      <div className="relative aspect-[20/9] overflow-hidden border-b border-border">
        <ProjectThumb motif={project.motif} />
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-medium">{project.title}</h3>
          {live ? (
            <Badge tone="accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden /> Live demo
            </Badge>
          ) : (
            <Badge tone="neutral">In progress</Badge>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">{project.description}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
        <div className="mt-auto pt-5 text-sm">
          {live ? (
            <span className="inline-flex items-center gap-1 font-medium text-accent">
              Open case study and demo <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
            </span>
          ) : (
            <span className="text-muted">Case study coming soon</span>
          )}
        </div>
      </div>
    </>
  );

  const base = "flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface";

  if (live) {
    return (
      <Link
        href={`/projects/${project.slug}`}
        className={cn(base, "group transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(27,31,36,0.18)] hover:border-accent/40 focus-visible:-translate-y-0.5")}
      >
        {inner}
      </Link>
    );
  }
  return (
    <article className={cn(base, "opacity-95")} aria-label={`${project.title} (in progress)`}>
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
        <span className="text-muted group-hover:text-accent" aria-hidden>
          {icon}
        </span>
        <span className="w-20 text-sm text-muted">{label}</span>
        <span className="flex-1 truncate text-sm font-medium">{value}</span>
        <ArrowUpRight className="h-4 w-4 text-muted group-hover:text-accent" aria-hidden />
      </a>
    </li>
  );
}
