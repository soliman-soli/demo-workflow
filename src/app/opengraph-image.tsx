import { ImageResponse } from "next/og";
import { siteConfig } from "@/site.config";

export const alt = siteConfig.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#F6F3EE",
          color: "#1B1F24",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, fontWeight: 600 }}>{siteConfig.name}</div>
        <div style={{ display: "flex", fontSize: 64, lineHeight: 1.1, maxWidth: 980 }}>
          {siteConfig.hero.headline}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, color: "#6F6A61" }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: "#1F6F5C" }} />
          Backend · Full-stack · AI automations
        </div>
      </div>
    ),
    size
  );
}

