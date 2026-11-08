/**
 * All personal text and links live here. Edit this file to update the site.
 */
export const siteConfig = {
  name: "Soliman",
  title: "Soliman · Backend & full-stack engineering",
  description:
    "Computer engineering student building backend-focused products and AI automations with TypeScript, Node.js and n8n.",
  url: "https://soliman.dev",
  footerNote: "Built with Next.js and n8n.",

  hero: {
    eyebrow: "Computer engineering student",
    headline: "I build backend-first products and AI automations that do real work.",
    sub: "APIs, workflows and the interfaces on top of them, from a C++ desktop dashboard to an AI-screened hiring pipeline.",
  },

  about: {
    intro:
      "I'm a computer engineering student who likes the parts of software most people never see: request flows, data contracts, background jobs and the failure cases in between. Lately that means wiring language models into real workflows with n8n, and building honest, fast interfaces on top with Next.js.",
    skills: [
      { group: "Languages", items: ["C++", "TypeScript", "JavaScript", "SQL"] },
      { group: "Frontend", items: ["React", "Next.js", "Tailwind CSS"] },
      { group: "Backend", items: ["Node.js", "n8n", "REST APIs", "Webhooks"] },
      { group: "Tools", items: ["Git", "Qt", "Vercel", "Google Sheets API", "Gemini API"] },
    ],
  },

  contact: {
    blurb: "Open to internships and junior backend or full-stack roles. The fastest way to reach me is email.",
    email: "soliman@example.com",
    github: "https://github.com/soliman",
    linkedin: "https://www.linkedin.com/in/soliman",
  },

  projects: [
    {
      slug: "hr-system",
      title: "HR Demo",
      description: "An AI-powered HR system: policy Q&A, CV coaching, screened applications and a recruiter dashboard.",
      tags: ["n8n", "Gemini", "Next.js", "TypeScript", "Google Sheets"],
      status: "live",
      motif: "hr",
    },
    {
      slug: null,
      title: "C++ / Qt Desktop Dashboard",
      description: "A native desktop dashboard for live data, built with C++ and Qt.",
      tags: ["C++", "Qt", "Desktop"],
      status: "in-progress",
      motif: "dashboard",
    },
    {
      slug: null,
      title: "Isometric Island Desktop Scene",
      description: "A hand-built isometric island scene rendered as an interactive desktop app.",
      tags: ["C++", "Graphics", "Desktop"],
      status: "in-progress",
      motif: "island",
    },
    {
      slug: null,
      title: "AI Car-Ad Video Pipeline",
      description: "An automated pipeline that turns car listings into short ad videos.",
      tags: ["n8n", "AI", "Video", "Automation"],
      status: "in-progress",
      motif: "video",
    },
  ],
} as const;

export type Project = (typeof siteConfig.projects)[number];
