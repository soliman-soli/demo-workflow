import type { ReactNode } from "react";

const routingRules = [
  {
    condition: "No prescription needed & in stock",
    outcome:
      "Auto-reserves stock immediately for 2 hours, deducts Google Sheet inventory, and replies in English & Arabic with pickup total.",
  },
  {
    condition: "Prescription needed (photo uploaded or catalog.requires_rx)",
    outcome:
      "Saves rows with status pending, tells the customer a pharmacist is reviewing, and posts an Approve/Reject card on Telegram. Stock is NOT deducted yet.",
  },
  {
    condition: "Prescription needed & out of stock",
    outcome:
      "Telegram card flags out of stock with a suggested alternative (name, code, price). Approve is blocked until stock exists; Reject remains enabled.",
  },
  {
    condition: "No prescription needed & out of stock",
    outcome:
      "Skips reservation and replies on WhatsApp that the item is unavailable while suggesting the configured alternative.",
  },
];

export function PharmacyCaseStudy() {
  return (
    <article
      className="mt-20 border-t border-border pt-14"
      aria-labelledby="case-title"
    >
      <p className="label-caps">Case study</p>
      <h2 id="case-title" className="mt-2 text-3xl font-medium">
        How it&apos;s built
      </h2>

      <div className="mt-10 grid grid-cols-12 gap-x-6 gap-y-12">
        <CaseSection title="The problem">
          <p>
            Neighborhood pharmacies take dozens of WhatsApp messages an hour: voice-like Arabic
            slang, misspelled English brand names, multi-item lists, and blurry prescription photos.
            Staff end up manually checking shelf stock, translating alternatives, and writing down
            holds that never expire.
          </p>
          <p>
            I built Dawaa Pharmacy to automate safe over-the-counter reservations while keeping a
            licensed pharmacist strictly in control of every prescription medicine and stock exception.
          </p>
        </CaseSection>

        <CaseSection title="How it works">
          <p>
            The browser only talks to Next.js route handlers under{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">/api/pharmacy/*</code>. Each
            handler validates requests with zod, checks image size and magic bytes, enforces rate
            limits, and calls protected n8n webhooks with a server-only secret header.
          </p>
          <FlowDiagram />
        </CaseSection>

        <CaseSection title="Routing rules">
          <p>
            Every matched item creates a normalized line row (<code className="text-xs">R-YYMMDD-XXXX</code>)
            and routes through deterministic safety rules:
          </p>
          <div className="mt-4 overflow-hidden rounded-[var(--radius-btn)] border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-xs uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Condition
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Outcome
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {routingRules.map((r) => (
                  <tr key={r.condition}>
                    <td className="align-top px-4 py-3 font-medium text-text">
                      {r.condition}
                    </td>
                    <td className="px-4 py-3 text-muted">{r.outcome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CaseSection>

        <CaseSection title="Tech decisions">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="font-medium text-text">
                n8n for workflow orchestration.
              </strong>{" "}
              Separate event-driven flows handle customer messages, Telegram callback approvals, and
              a 2-hour scheduled expiry sweep with built-in retries.
            </li>
            <li>
              <strong className="font-medium text-text">
                Thin Next.js security boundary.
              </strong>{" "}
              <code className="text-xs">N8N_PHARMACY_BASE_URL</code> and{" "}
              <code className="text-xs">N8N_SECRET</code> never reach client bundles; both inputs
              and upstream n8n JSON responses are checked against zod schemas.
            </li>
            <li>
              <strong className="font-medium text-text">
                Google Sheets as transparent ops state.
              </strong>{" "}
              Non-technical staff can inspect live stock, reservations, and errors directly without
              requiring a custom backoffice first.
            </li>
            <li>
              <strong className="font-medium text-text">
                AI extracts, humans approve.
              </strong>{" "}
              Gemini 2.5 Flash only parses messy text/photos into structured medicine arrays. Only a
              pharmacist clicking Telegram inline callbacks can approve a prescription.
            </li>
          </ul>
        </CaseSection>

        <CaseSection title="What I'd improve">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Replace Google Sheets with Postgres row-level locking (<code className="text-xs">SELECT ... FOR UPDATE</code>)
              so concurrent reservations never race on the last unit in stock.
            </li>
            <li>
              Integrate directly with pharmacy POS/ERP inventory instead of periodic catalog sync.
            </li>
            <li>
              Add OCR confidence scoring and automatic pharmacist quantity/medicine editing right inside Telegram.
            </li>
            <li>
              Push real-time Server-Sent Events (SSE) from n8n completion webhooks to eliminate client polling.
            </li>
          </ul>
        </CaseSection>
      </div>
    </article>
  );
}

function CaseSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="col-span-12 grid grid-cols-12 gap-6">
      <h3 className="col-span-12 text-xl font-medium md:col-span-4">{title}</h3>
      <div className="col-span-12 space-y-3 text-sm leading-relaxed text-muted md:col-span-8 sm:text-base">
        {children}
      </div>
    </section>
  );
}

function FlowDiagram() {
  const box =
    "rounded-[var(--radius-btn)] border border-border bg-surface px-3 py-2 text-center text-sm font-medium text-text";
  return (
    <figure
      className="mt-5"
      aria-label="Architecture flow: Browser to Next.js /api/pharmacy/* to n8n, which calls Gemini, Google Sheets, and Telegram"
    >
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <div className={box}>Browser</div>
        <Arrow />
        <div className={box}>
          Next.js{" "}
          <span className="block text-xs font-normal text-muted">
            /api/pharmacy/*
          </span>
        </div>
        <Arrow />
        <div className={`${box} border-accent/50`}>
          n8n{" "}
          <span className="block text-xs font-normal text-muted">workflows</span>
        </div>
        <Arrow />
        <div className="flex flex-col gap-1.5">
          {["Gemini", "Google Sheets", "Telegram"].map((s) => (
            <div
              key={s}
              className="rounded-md bg-surface-2 px-3 py-1 text-center text-xs text-text"
            >
              {s}
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mt-3 text-xs text-muted">
        The browser never sees the n8n URL, secret header, or uploaded photo storage.
      </figcaption>
    </figure>
  );
}

function Arrow() {
  return (
    <span aria-hidden className="self-center text-muted">
      <span className="hidden sm:inline">→</span>
      <span className="sm:hidden">↓</span>
    </span>
  );
}
