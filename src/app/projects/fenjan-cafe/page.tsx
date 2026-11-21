import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ChevronRight, Download } from "lucide-react";
import { Tag } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { FenjanDemo } from "@/features/fenjan/components/fenjan-demo";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  title: "Fenjan Café · Order by DM",
  description:
    "Coffee-shop DM ordering automation built with n8n, Gemini, Meta Graph API, Google Sheets, and Telegram.",
  openGraph: {
    title: `Fenjan Café · Order by DM · ${siteConfig.name}`,
    description:
      "Coffee-shop DM ordering automation built with n8n, Gemini, Meta Graph API, Google Sheets, and Telegram.",
    url: `${siteConfig.url}/projects/fenjan-cafe`,
    siteName: siteConfig.name,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: `Fenjan Café · Order by DM · ${siteConfig.name}`,
    description:
      "Coffee-shop DM ordering automation built with n8n, Gemini, Meta Graph API, Google Sheets, and Telegram.",
  },
};

const TAGS = [
  "n8n",
  "Gemini",
  "Meta Graph API",
  "Next.js",
  "TypeScript",
  "Google Sheets",
  "Telegram",
];

const STATS = [
  { label: "Menu items", value: "14", note: "Arabic + English" },
  { label: "n8n workflows", value: "4", note: "Setup, bot, kitchen, specials" },
  { label: "Delivery fee", value: "25 EGP", note: "Fixed flat rate" },
  { label: "Café hours", value: "08:00 – 00:00", note: "Daily confirmation window" },
];

const HOW_STEPS = [
  {
    n: "01",
    title: "A DM arrives",
    body: "Messages from Messenger, Instagram, or the portal webhook land in n8n and trigger a single normalized turn.",
  },
  {
    n: "02",
    title: "Gemini reads it",
    body: "Gemini turns Arabic, English, or Franco text into structured JSON: intent, menu IDs, quantities, delivery mode, and language.",
  },
  {
    n: "03",
    title: "Rules build the reply",
    body: "Fixed JavaScript rules check the Google Sheet Menu, enforce the 20-item limit and café hours, and compute exact totals.",
  },
  {
    n: "04",
    title: "The kitchen takes over",
    body: "Confirmed orders append to Orders and ping Telegram. Kitchen status updates automatically message the customer.",
  },
];

const WORKFLOW_DOWNLOADS = [
  {
    label: "Fenjan 0 · Setup Sheet",
    file: "fenjan-0-setup.json",
    note: "Creates the spreadsheet tabs and seeds the 14-item menu once.",
  },
  {
    label: "Fenjan 1 · Order Bot",
    file: "fenjan-1-order-bot.json",
    note: "Handles Messenger, Instagram, and portal chat orders via Gemini + Rules.",
  },
  {
    label: "Fenjan 2 · Kitchen & Status",
    file: "fenjan-2-kitchen-status.json",
    note: "Updates order status from the kitchen form and notifies the customer.",
  },
  {
    label: "Fenjan 3 · Daily Specials",
    file: "fenjan-3-daily-specials.json",
    note: "Posts the daily café special and serves GET /webhook/fenjan-specials.",
  },
];

const BUILT_WITH = [
  "n8n (4 modular workflows)",
  "Google Gemini for natural-language parsing",
  "Meta Graph API (Messenger, Instagram & Facebook Page)",
  "Google Sheets (Menu, Carts, Orders, Specials, Errors)",
  "Telegram alerts & Next.js / TypeScript proxy routes",
];

const SAFEGUARDS = [
  "Unknown or unavailable items are named, never added",
  "Max 20 of one item; delivery requires a street address",
  "Orders confirm only 08:00 to midnight",
  "Unreadable messages escalate directly to a person",
  "Every failure is logged in Google Sheets and sent to Telegram",
];

const SETUP_STEPS = [
  "Import the four workflow JSON files into n8n.",
  "Connect your Meta, Google Sheets, Telegram, and Gemini credentials.",
  "Run Fenjan 0 once to initialize the spreadsheet structure and menu.",
  "Fill the Config nodes with your Sheet ID and webhook values.",
  "Activate workflows 1, 2, and 3, then set the three FENJAN_*_URL vars.",
];

export default function FenjanCafePage() {
  return (
    <>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/#projects" className="hover:text-text">
              Projects
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li aria-current="page" className="text-text">
            Fenjan Café · Order by DM
          </li>
        </ol>
      </nav>

      {/* 1. Hero */}
      <header className="mt-6 grid grid-cols-12 items-center gap-8">
        <div className="col-span-12 lg:col-span-7">
          <h1 className="text-4xl font-medium sm:text-5xl">
            Order your coffee in a DM
          </h1>
          <p
            lang="ar"
            dir="rtl"
            className="mt-2 font-sans text-xl font-medium text-accent sm:text-2xl"
          >
            اطلب قهوتك في رسالة
          </p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Fenjan Café takes coffee orders across Messenger, Instagram, and web chat.
            Gemini extracts what the customer asked for in Arabic, English, or Franco, while
            Google Sheets and deterministic workflow rules control pricing, stock, hours,
            and kitchen notifications.
          </p>

          <div className="mt-5 flex flex-wrap gap-1.5">
            {TAGS.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#demo" className={buttonVariants({ size: "lg" })}>
              Try the demo <ArrowDown className="h-4 w-4" aria-hidden />
            </a>
            <a
              href="#workflows"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              See the workflows
            </a>
          </div>
        </div>

        {/* Sample exchange visual */}
        <div className="col-span-12 lg:col-span-5">
          <div className="space-y-3 rounded-[var(--radius-card)] border border-border bg-surface p-5">
            <p className="label-caps">Sample DM exchange</p>
            <div className="flex justify-end">
              <div
                lang="ar"
                dir="rtl"
                className="rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm text-accent-contrast"
              >
                عايز ٢ سبانش لاتيه، توصيل على المعادي
              </div>
            </div>
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-border bg-surface-2 px-4 py-2.5 text-sm text-text">
                Order confirmed · 2 × Spanish Latte + 25 EGP delivery. Sent to
                kitchen &amp; Telegram.
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Stats Row */}
      <section aria-label="System highlights" className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-[var(--radius-card)] border border-border bg-surface p-4"
          >
            <p className="label-caps">{s.label}</p>
            <p className="mt-2 font-heading text-2xl font-medium text-text tabular-nums">
              {s.value}
            </p>
            <p className="mt-1 text-xs text-muted">{s.note}</p>
          </div>
        ))}
      </section>

      {/* 3. Live Thin-Client Demo */}
      <section id="demo" className="mt-14 scroll-mt-20" aria-labelledby="demo-title">
        <div className="mb-5">
          <p className="label-caps">Live portal client</p>
          <h2 id="demo-title" className="mt-1 text-3xl font-medium">
            Try the bot live
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Every reply, cart item, hour status, and order update below comes directly from
            live n8n webhooks via Next.js server routes. Nothing is mocked or calculated in the
            browser.
          </p>
        </div>

        <FenjanDemo />
      </section>

      {/* 4. How It Works & Workflow Downloads */}
      <section
        id="workflows"
        className="mt-20 scroll-mt-20 border-t border-border pt-14"
        aria-labelledby="how-title"
      >
        <p className="label-caps">How it works</p>
        <h2 id="how-title" className="mt-2 text-3xl font-medium">
          Deterministic rules around AI extraction
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted">
          The AI only reads meaning; items, prices, totals, hours and fees always come from the
          sheet and fixed rules.
        </p>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_STEPS.map((s) => (
            <li
              key={s.n}
              className="rounded-[var(--radius-card)] border border-border bg-surface p-5"
            >
              <span className="font-mono text-xs font-semibold text-accent">
                {s.n}
              </span>
              <h3 className="mt-2 text-lg font-medium text-text">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>

        {/* Workflow JSON Downloads */}
        <div className="mt-8 rounded-[var(--radius-card)] border border-border bg-surface p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-medium text-text">Workflow JSON files</h3>
              <p className="mt-1 text-sm text-muted">
                Served directly from <code className="text-xs">/workflows/*.json</code> for
                import into n8n.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {WORKFLOW_DOWNLOADS.map((wf) => (
              <div
                key={wf.file}
                className="flex flex-col justify-between gap-3 rounded-[var(--radius-btn)] border border-border bg-bg/40 p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <p className="font-medium text-text">{wf.label}</p>
                  <p className="mt-1 text-xs text-muted">{wf.note}</p>
                </div>
                <a
                  href={`/workflows/${wf.file}`}
                  download={wf.file}
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "shrink-0",
                  })}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  JSON
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Built With, Safeguards & Run It Yourself */}
      <section
        aria-label="Architecture details and setup"
        className="mt-12 grid gap-5 md:grid-cols-3"
      >
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6">
          <h3 className="text-xl font-medium text-text">Built with</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            {BUILT_WITH.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6">
          <h3 className="text-xl font-medium text-text">Safeguards</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            {SAFEGUARDS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6">
          <h3 className="text-xl font-medium text-text">Run it yourself</h3>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
            {SETUP_STEPS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
