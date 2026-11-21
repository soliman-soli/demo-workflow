import type { MetadataRoute } from "next";
import { siteConfig } from "@/site.config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url.replace(/\/+$/, "");
  const routes = [
    "",
    "/projects/hr-system",
    "/projects/hr-system/ask",
    "/projects/hr-system/coach",
    "/projects/hr-system/apply",
    "/projects/hr-system/hr/dashboard",
    "/projects/pharmacy-system",
    "/projects/fenjan-cafe",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
