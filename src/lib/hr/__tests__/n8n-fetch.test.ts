import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { n8nFetch } from "../n8n-fetch";

describe("n8nFetch helper", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.N8N_BASE_URL = "https://n8n.example.com/webhook";
    process.env.N8N_WEBHOOK_KEY = "secret-test-key";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("returns 503 when N8N_BASE_URL or N8N_WEBHOOK_KEY is missing", async () => {
    delete process.env.N8N_WEBHOOK_KEY;
    const res = await n8nFetch("/hr/health");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.status).toBe(503);
      expect(res.error).not.toContain("n8n.example.com");
    }
  });

  it("attaches X-API-KEY header and validates response schema", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "live", time: "2026-11-08T18:00:00Z" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const schema = z.object({ status: z.literal("live"), time: z.string() });
    const res = await n8nFetch("/hr/health", { schema });

    expect(res.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [calledUrl, calledInit] = fetchSpy.mock.calls[0];
    expect(calledUrl).toBe("https://n8n.example.com/webhook/hr/health");
    expect((calledInit?.headers as Record<string, string>)["X-API-KEY"]).toBe("secret-test-key");
  });

  it("normalizes upstream 500 errors without leaking upstream details", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Internal secret stack trace at n8n.internal", { status: 500 })
    );

    const res = await n8nFetch("/hr/chat", { method: "POST", body: { message: "hi" } });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.status).toBe(502);
      expect(res.error).not.toContain("n8n.internal");
      expect(res.error).not.toContain("stack trace");
    }
  });

  it("fails gracefully when upstream JSON does not match schema", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ unexpected: true }), { status: 200 })
    );

    const schema = z.object({ status: z.literal("live") });
    const res = await n8nFetch("/hr/health", { schema });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.status).toBe(502);
    }
  });
});

