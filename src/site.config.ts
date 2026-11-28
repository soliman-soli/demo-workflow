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
    eyebrow: "AI Automation & Systems Engineer",
    headline:
      "I design and ship AI workflows and backend systems that run real operations.",
    sub: "LLM pipelines, RAG retrieval, REST APIs, and the clean interfaces on top of them — every project below runs live against real automation workflows.",
  },

  highlights: [
    {
      value: "4 live systems",
      label: "Interactive n8n + Gemini workflows backed by live sheets and messaging",
    },
    {
      value: "30+ repos / < 2 min",
      label: "Automated GitHub candidate analysis with LangChain, CodeBERT, and Qdrant",
    },
    {
      value: "Multi-channel",
      label: "WhatsApp, Telegram, Meta DM, Gmail, and REST API orchestration",
    },
    {
      value: "Full-stack core",
      label: "Python (FastAPI), TypeScript (Next.js / Node.js), SQL, and Docker",
    },
  ],

  about: {
    intro:
      "AI Automation Engineer & Computer Engineer who builds LLM-powered workflows, Retrieval-Augmented Generation (RAG) pipelines, and REST APIs in Python. Automated the analysis of 30+ GitHub repositories per candidate into structured recruiter reports in under 2 minutes using LangChain, CodeBERT, and the Gemini API. Experienced in vector databases (Qdrant), hybrid retrieval, third-party API integration, and Docker deployment. Seeking an AI automation role focused on LLM integration and workflow automation.",
    skills: [
      {
        group: "AI & Automation",
        items: [
          "LLM Integration",
          "Retrieval-Augmented Generation (RAG)",
          "Prompt Engineering",
          "Workflow Automation",
          "Pipeline Orchestration",
          "LangChain",
          "OpenAI API",
          "OpenAI Embeddings",
          "Gemini API",
          "CodeBERT",
          "Hybrid Search",
          "BM25",
          "Vector Databases (Qdrant)",
        ],
      },
      {
        group: "Backend & APIs",
        items: [
          "Python",
          "FastAPI",
          "Node.js",
          "REST API Design",
          "API Integration",
          "GitHub API",
          "Asynchronous Programming",
          "Pydantic",
          "JWT Authentication",
          "OpenAPI",
          "Swagger",
        ],
      },
      {
        group: "Data & Databases",
        items: [
          "MySQL",
          "Qdrant",
          "Query Optimization",
          "Indexing",
          "ORM",
          "Pandas",
          "NumPy",
          "Matplotlib",
          "Seaborn",
          "Power BI",
        ],
      },
      {
        group: "DevOps & Tools",
        items: ["Docker", "Git", "Linux", "Locust (load testing)"],
      },
      {
        group: "Languages & Frontend",
        items: [
          "Python",
          "JavaScript (ES6+)",
          "C++",
          "PHP",
          "React",
          "HTML5",
          "CSS3",
          "AJAX",
        ],
      },
    ],
  },

  contact: {
    blurb:
      "Open to AI automation, backend, and full-stack roles or internships. Email is the fastest way to reach me.",
    email: "soliman.solim22@gmail.com",
    github: "https://github.com/soliman-soli",
    linkedin: "https://www.linkedin.com/in/soliman-ahmed-software",
    resumeUrl: "",
  },

  projects: [
    {
      slug: "hr-system",
      title: "HR Demo",
      description:
        "An AI-powered HR system: policy Q&A, CV coaching, screened applications and a recruiter dashboard.",
      tags: ["n8n", "Gemini", "Next.js", "TypeScript", "Google Sheets"],
      status: "live",
      motif: "hr",
    },
    {
      slug: "pharmacy-system",
      title: "Dawaa Pharmacy",
      description:
        "WhatsApp pharmacy ordering: AI reads requests and prescriptions, auto-reserves safe orders, and routes the rest to a pharmacist on Telegram.",
      tags: [
        "n8n",
        "Gemini",
        "Next.js",
        "TypeScript",
        "Google Sheets",
        "WhatsApp",
        "Telegram",
      ],
      status: "live",
      motif: "pharmacy",
    },
    {
      slug: "fenjan-cafe",
      title: "Fenjan Café · Order by DM",
      description:
        "Coffee-shop DM ordering bot: Gemini reads Arabic, English, or Franco requests while Google Sheets enforces menu, prices, hours, and kitchen status.",
      tags: [
        "n8n",
        "Gemini",
        "Meta Graph API",
        "Next.js",
        "TypeScript",
        "Google Sheets",
        "Telegram",
      ],
      status: "live",
      motif: "cafe",
    },
    {
      slug: "mozakra",
      title: "Mozakra · AI Study Coach",
      description:
        "Paste a lecture or upload a PDF: Gemini writes the quiz, code validates every question, and spaced repetition decides when each one comes back.",
      tags: ["n8n", "Gemini", "Google Sheets", "Google Drive", "Gmail", "Google Docs"],
      status: "live",
      motif: "study",
    },
  ],
} as const;

export type Project = (typeof siteConfig.projects)[number];
