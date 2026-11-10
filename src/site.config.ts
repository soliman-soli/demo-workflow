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
        items: ["Python", "JavaScript (ES6+)", "C++", "PHP", "React", "HTML5", "CSS3", "AJAX"],
      },
    ],
  },

  contact: {
    blurb: "Open to internships and junior backend or full-stack roles. The fastest way to reach me is email.",
    email: "soliman.solim22@gmail.com",
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
  ],
} as const;

export type Project = (typeof siteConfig.projects)[number];
