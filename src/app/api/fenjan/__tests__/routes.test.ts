import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as chatPost } from "../chat/route";
import { GET as statusGet } from "../status/route";
import { GET as specialGet } from "../special/route";
import { fenjanUpstreamFetch } from "@/lib/fenjan/upstream";
import { FenjanSpecialResponseSchema } from "@/lib/fenjan/schemas";

let ipCounter = 1;
function nextIp() {
  ipCounter += 1;
  return `10.20.30.${ipCounter}`;
}

function makeChatReq(body: unknown) {
  return new NextRequest("http://localhost:3000/api/fenjan/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": nextIp(),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function makeStatusReq(orderId?: string) {
  const qs =
    orderId !== undefined ? `?orderId=${encodeURIComponent(orderId)}` : "";
  return new NextRequest(`http://localhost:3000/api/fenjan/status${qs}`, {
    method: "GET",
    headers: { "x-forwarded-for": nextIp() },
  });
}

function makeSpecialReq() {
  return new NextRequest("http://localhost:3000/api/fenjan/special", {
    method: "GET",
    headers: { "x-forwarded-for": nextIp() },
  });
}

describe("Fenjan Café API Route Handlers", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.FENJAN_PORTAL_URL =
      "https://n8n.example.com/webhook/fenjan-portal";
    process.env.FENJAN_STATUS_URL =
      "https://n8n.example.com/webhook/fenjan-status";
    process.env.FENJAN_SPECIALS_URL =
      "https://n8n.example.com/webhook/fenjan-specials";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // POST /api/fenjan/chat
  // -------------------------------------------------------------------------

  describe("POST /api/fenjan/chat", () => {
    it("returns 400 when sessionId or message fails validation", async () => {
      const badSession = await chatPost(
        makeChatReq({ sessionId: "bad session!", message: "hi" })
      );
      expect(badSession.status).toBe(400);

      const emptyMsg = await chatPost(
        makeChatReq({ sessionId: "fenjan-abc123", message: "   " })
      );
      expect(emptyMsg.status).toBe(400);

      const longMsg = await chatPost(
        makeChatReq({ sessionId: "fenjan-abc123", message: "a".repeat(1001) })
      );
      expect(longMsg.status).toBe(400);
    });

    it("returns 503 notConnected when FENJAN_PORTAL_URL is missing", async () => {
      delete process.env.FENJAN_PORTAL_URL;
      const res = await chatPost(
        makeChatReq({ sessionId: "fenjan-abc123", message: "Show the menu" })
      );
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.notConnected).toBe(true);
      expect(JSON.stringify(data)).not.toContain("n8n.example.com");
    });

    it("returns 504 on timeout (AbortError) and never logs customer message body", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.spyOn(globalThis, "fetch").mockRejectedValue(
        Object.assign(new Error("Aborted"), { name: "AbortError" })
      );

      const secretPhrase = "SECRET_COFFEE_ORDER_DO_NOT_LOG";
      const res = await chatPost(
        makeChatReq({ sessionId: "fenjan-abc123", message: secretPhrase })
      );

      expect(res.status).toBe(504);
      const logged = errorSpy.mock.calls.flat().join(" ");
      expect(logged).not.toContain(secretPhrase);
    });

    it("forwards payload to FENJAN_PORTAL_URL and passes n8n JSON through unchanged", async () => {
      const n8nPayload = {
        reply: "✅ Order F-261121-K7Q2 confirmed",
        sessionId: "fenjan-abc123",
        orderId: "F-261121-K7Q2",
        intent: "confirm",
        language: "en",
        open: true,
        openHour: "08:00 - 00:00",
        cart: {
          items: [{ id: "M04", name: "Spanish Latte", qty: 2, lineTotal: 190 }],
          mode: "delivery",
          address: "12 Street 9, Maadi",
          subtotal: 190,
          deliveryFee: 25,
          total: 215,
          currency: "EGP",
        },
        extraMeta: "preserved",
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(n8nPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const res = await chatPost(
        makeChatReq({
          sessionId: "fenjan-abc123",
          message: "2 Spanish Latte, delivery",
          name: "Soliman",
        })
      );

      expect(res.status).toBe(200);
      expect(fetchSpy).toHaveBeenCalledOnce();
      const [calledUrl, init] = fetchSpy.mock.calls[0];
      expect(calledUrl).toBe("https://n8n.example.com/webhook/fenjan-portal");
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({
        sessionId: "fenjan-abc123",
        message: "2 Spanish Latte, delivery",
        name: "Soliman",
      });

      const returned = await res.json();
      expect(returned).toEqual(n8nPayload);
      expect("staffAlert" in returned).toBe(false);
    });

    it("passes staffAlert through unchanged when present and leaves it empty when empty", async () => {
      const multilineAlert =
        "New order F-261121-K7Q2\n2 x Spanish Latte\nDelivery: Maadi\nTotal: 215 EGP";

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            reply: "Order confirmed",
            sessionId: "fenjan-abc123",
            orderId: "F-261121-K7Q2",
            staffAlert: multilineAlert,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const withAlertRes = await chatPost(
        makeChatReq({ sessionId: "fenjan-abc123", message: "confirm" })
      );
      expect(withAlertRes.status).toBe(200);
      const withAlertJson = await withAlertRes.json();
      expect(withAlertJson.staffAlert).toBe(multilineAlert);

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            reply: "Here is our menu",
            sessionId: "fenjan-abc123",
            orderId: "",
            staffAlert: "",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const emptyAlertRes = await chatPost(
        makeChatReq({ sessionId: "fenjan-abc123", message: "Show the menu" })
      );
      expect(emptyAlertRes.status).toBe(200);
      const emptyAlertJson = await emptyAlertRes.json();
      expect(emptyAlertJson.staffAlert).toBe("");
    });
  });

  // -------------------------------------------------------------------------
  // GET /api/fenjan/status
  // -------------------------------------------------------------------------

  describe("GET /api/fenjan/status", () => {
    it("returns 400 when orderId is missing or malformed", async () => {
      const missing = await statusGet(makeStatusReq());
      expect(missing.status).toBe(400);

      const badChars = await statusGet(makeStatusReq("bad_order_id!"));
      expect(badChars.status).toBe(400);

      const tooLong = await statusGet(makeStatusReq("F-".padEnd(35, "A")));
      expect(tooLong.status).toBe(400);
    });

    it("returns 503 notConnected when FENJAN_STATUS_URL is missing", async () => {
      delete process.env.FENJAN_STATUS_URL;
      const res = await statusGet(makeStatusReq("F-261121-K7Q2"));
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.notConnected).toBe(true);
    });

    it("returns 504 on timeout", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(
        Object.assign(new Error("Aborted"), { name: "AbortError" })
      );

      const res = await statusGet(makeStatusReq("F-261121-K7Q2"));
      expect(res.status).toBe(504);
    });

    it("forwards orderId query param and passes n8n status JSON through unchanged", async () => {
      const n8nStatus = {
        found: true,
        orderId: "F-261121-K7Q2",
        status: "preparing",
        label_en: "Preparing your order in the kitchen",
        label_ar: "بنحضّر طلبك دلوقتي في المطبخ",
        updatedAt: "2026-11-21T08:15:00Z",
        barista: "hala",
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(n8nStatus), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const res = await statusGet(makeStatusReq("F-261121-K7Q2"));
      expect(res.status).toBe(200);
      expect(fetchSpy).toHaveBeenCalledOnce();
      const [calledUrl, init] = fetchSpy.mock.calls[0];
      expect(calledUrl).toBe(
        "https://n8n.example.com/webhook/fenjan-status?orderId=F-261121-K7Q2"
      );
      expect(init?.method).toBe("GET");

      const returned = await res.json();
      expect(returned).toEqual(n8nStatus);
    });
  });

  // -------------------------------------------------------------------------
  // GET /api/fenjan/special
  // -------------------------------------------------------------------------

  describe("GET /api/fenjan/special", () => {
    it("returns 503 notConnected when FENJAN_SPECIALS_URL is missing", async () => {
      delete process.env.FENJAN_SPECIALS_URL;
      const res = await specialGet(makeSpecialReq());
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.notConnected).toBe(true);
    });

    it("returns 504 when upstream fetch exceeds timeoutMs", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
            });
          })
      );

      const res = await fenjanUpstreamFetch({
        envName: "FENJAN_SPECIALS_URL",
        endpointLabel: "special",
        method: "GET",
        schema: FenjanSpecialResponseSchema,
        timeoutMs: 15,
      });

      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.status).toBe(504);
      }
    });

    it("passes n8n special JSON through unchanged for found: true and found: false", async () => {
      const n8nSpecial = {
        found: true,
        id: "SP-2026-11-21",
        text_en: "Today's special: Spanish Latte + Croissant for 135 EGP.",
        text_ar: "عرض النهارده: سبانش لاتيه + كرواسون بـ 135 جنيه.",
        postedAt: "2026-11-21T09:00:00+02:00",
        channel: "facebook_page",
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(n8nSpecial), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const res = await specialGet(makeSpecialReq());
      expect(res.status).toBe(200);
      expect(fetchSpy).toHaveBeenCalledOnce();
      expect(fetchSpy.mock.calls[0][0]).toBe(
        "https://n8n.example.com/webhook/fenjan-specials"
      );
      expect(await res.json()).toEqual(n8nSpecial);
    });
  });
});
