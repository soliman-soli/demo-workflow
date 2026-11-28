import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Tag } from "@/components/ui/badge";
import { Notice } from "@/components/ui/states";
import { PharmacyCaseStudy } from "@/features/pharmacy/components/pharmacy-case-study";
import { PharmacySimulator } from "@/features/pharmacy/components/pharmacy-simulator";

export const metadata: Metadata = {
  title: "Dawaa Pharmacy",
  description:
    "WhatsApp pharmacy ordering simulator: AI parses requests and prescriptions, auto-reserves safe orders, and routes prescriptions to a pharmacist on Telegram.",
};

const TAGS = [
  "n8n",
  "Gemini",
  "Next.js",
  "TypeScript",
  "Google Sheets",
  "WhatsApp",
  "Telegram",
];

export default function PharmacySystemPage() {
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
            Dawaa Pharmacy
          </li>
        </ol>
      </nav>

      {/* Title */}
      <header className="mt-6 grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-9">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">Dawaa Pharmacy</h1>
          <p className="mt-3 text-lg text-muted">
            WhatsApp pharmacy ordering: AI reads requests and prescriptions, auto-reserves safe
            orders, and routes the rest to a pharmacist on Telegram.
          </p>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {TAGS.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>
      </header>

      {/* Visible synthetic data / non-medical notice */}
      <div className="mt-6">
        <Notice tone="info">
          Demo only. Not medical advice. Not a real pharmacy. Customer names are synthetic and
          uploaded images are never stored.
        </Notice>
      </div>

      {/* Interactive 3-Column Simulator + Google Sheet Viewer */}
      <section className="mt-8" aria-labelledby="demo-title">
        <h2 id="demo-title" className="sr-only">
          Interactive pharmacy workflow simulator
        </h2>
        <PharmacySimulator />
      </section>

      {/* Case Study */}
      <PharmacyCaseStudy />
    </>
  );
}
