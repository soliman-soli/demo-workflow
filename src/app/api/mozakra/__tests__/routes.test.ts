import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as startPost } from "../start/route";
import { POST as gradePost } from "../grade/route";
import { POST as nextPost } from "../next/route";
import { POST as statePost } from "../state/route";
import { GET as overviewGet } from "../overview/route";
import { clearMozakraOverviewCache } from "@/lib/mozakra/overview-cache";
import { SAMPLE_LECTURE_TEXT } from "@/lib/mozakra/offline-sample";
import { MOZAKRA_SESSION_COOKIE } from "@/lib/mozakra/session";

const VALID_HEX32 = "a1b2c3d4e5f60718293a4b5c6d7e8f90";

let ipCounter = 1;
function nextIp() {
  ipCounter += 1;
  return `10.50.60.${ipCounter}`;
}

function makeStartReq(body: unknown) {
  return new NextRequest("http://localhost:3000/api/mozakra/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": nextIp(),
    },
    body: JSON.stringify(body),
  });
}

function makeGradeReq(body: unknown) {
  return new NextRequest("http://localhost:3000/api/mozakra/grade", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": nextIp(),
    },
    body: JSON.stringify(body),
  });
}

function makeNextReq(body: unknown, sessionCookie?: string) {
  return new NextRequest("http://localhost:3000/api/mozakra/next", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": nextIp(),
      ...(sessionCookie
        ? { cookie: `${MOZAKRA_SESSION_COOKIE}=${sessionCookie}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
}

function makeStateReq(sessionCookie?: string) {
  return new NextRequest("http://localhost:3000/api/mozakra/state", {
    method: "POST",
    headers: {
      "x-forwarded-for": nextIp(),
      ...(sessionCookie
        ? { cookie: `${MOZAKRA_SESSION_COOKIE}=${sessionCookie}` }
        : {}),
    },
  });
}

function makeOverviewReq() {
  return new NextRequest("http://localhost:3000/api/mozakra/overview", {
    method: "GET",
    headers: { "x-forwarded-for": nextIp() },
  });
}

describe("Mozakra Live Portal API Route Handlers", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.N8N_BASE_URL = "https://n8n.example.com";
    process.env.N8N_MOZAKRA_KEY = "secret-mozakra-key";
    clearMozakraOverviewCache();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe("POST /api/mozakra/start", () => {
    it("rejects text < 200 chars or > 30,000 chars with 400", async () => {
      const shortRes = await startPost(makeStartReq({ text: "short" }));
      expect(shortRes.status).toBe(400);

      const longRes = await startPost(makeStartReq({ text: "a".repeat(30_001) }));
      expect(longRes.status).toBe(400);
    });

    it("returns offline error when env vars are missing", async () => {
      delete process.env.N8N_MOZAKRA_KEY;
      const res = await startPost(makeStartReq({ text: SAMPLE_LECTURE_TEXT }));
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBe("The live demo backend is offline right now.");
    });

    it("sets httpOnly sessionId cookie, strips sessionId from JSON, and adds ngrok header", async () => {
      process.env.N8N_BASE_URL = "https://demo-xyz.ngrok-free.app";

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
            status: 200,
            sessionId: VALID_HEX32,
            lectureId: "lec-001",
            simDate: "2026-11-28",
            summary: "Summary text",
            terms: [{ term: "Hash", definition: "Maps keys to indices." }],
            dropped: [{ n: 2, why: "duplicate options" }],
            validCount: 5,
            quiz: {
              token: VALID_HEX32,
              total: 1,
              questions: [
                {
                  questionId: "q1",
                  topic: "Hash",
                  question: "Average lookup?",
                  options: { A: "O(1)", B: "O(n)", C: "O(log n)", D: "O(n^2)" },
                },
              ],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const res = await startPost(makeStartReq({ text: SAMPLE_LECTURE_TEXT }));
      expect(res.status).toBe(200);

      const [url, init] = fetchSpy.mock.calls[0];
      expect(url).toBe("https://demo-xyz.ngrok-free.app/webhook/mozakra/live/start");
      const headers = init?.headers as Record<string, string>;
      expect(headers["x-api-key"]).toBe("secret-mozakra-key");
      expect(headers["ngrok-skip-browser-warning"]).toBe("true");

      // sessionId is in httpOnly cookie and NOT in response JSON
      const setCookie = res.headers.get("set-cookie") ?? "";
      expect(setCookie).toContain(`${MOZAKRA_SESSION_COOKIE}=${VALID_HEX32}`);
      expect(setCookie.toLowerCase()).toContain("httponly");

      const body = await res.json();
      expect(body.ok).toBe(true);
      expect("sessionId" in body).toBe(false);
    });
  });

  describe("POST /api/mozakra/grade", () => {
    it("validates 32-hex token and A-D answers", async () => {
      const badToken = await gradePost(
        makeGradeReq({ token: "not-hex", answers: { q1: "A" } })
      );
      expect(badToken.status).toBe(400);

      const badAnswer = await gradePost(
        makeGradeReq({ token: VALID_HEX32, answers: { q1: "Z" } })
      );
      expect(badAnswer.status).toBe(400);
    });

    it("passes 409 already-submitted errors from n8n", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: false,
            status: 409,
            error: "This quiz was already submitted.",
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        )
      );

      const res = await gradePost(
        makeGradeReq({ token: VALID_HEX32, answers: { q1: "A" } })
      );
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toBe("This quiz was already submitted.");
    });
  });

  describe("POST /api/mozakra/next & /state", () => {
    it("validates daysForward in {1,3,7,14} and requires httpOnly session cookie", async () => {
      const noCookie = await nextPost(makeNextReq({ daysForward: 1 }));
      expect(noCookie.status).toBe(400);

      const badDays = await nextPost(
        makeNextReq({ daysForward: 5 }, VALID_HEX32)
      );
      expect(badDays.status).toBe(400);

      const noStateCookie = await statePost(makeStateReq());
      expect(noStateCookie.status).toBe(400);
    });

    it("forwards sessionId from cookie to /live/next and /live/state", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              ok: true,
              simDate: "2026-11-29",
              none: true,
              message: "Nothing due yet.",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              ok: true,
              simDate: "2026-11-29",
              boxCounts: { "1": 1, "2": 4, "3": 0, "4": 0 },
              cards: [],
              quizzes: [],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );

      const nextRes = await nextPost(makeNextReq({ daysForward: 1 }, VALID_HEX32));
      expect(nextRes.status).toBe(200);
      expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({
        sessionId: VALID_HEX32,
        daysForward: 1,
      });

      const stateRes = await statePost(makeStateReq(VALID_HEX32));
      expect(stateRes.status).toBe(200);
      expect(JSON.parse(String(fetchSpy.mock.calls[1][1]?.body))).toEqual({
        sessionId: VALID_HEX32,
      });
    });
  });

  describe("GET /api/mozakra/overview", () => {
    it("caches upstream overview response for 60 seconds", async () => {
      const overviewPayload = {
        ok: true,
        updatedAt: "2026-11-28T09:00:00Z",
        lectures: 4,
        questionsInBank: 36,
        sessions: 9,
        quizzesSent: 15,
        quizzesCompleted: 12,
        completionRate: 80,
        averageScore: 76,
        boxDistribution: { "1": 8, "2": 14, "3": 10, "4": 4 },
        weakestTopics: [{ topic: "Rehashing", percentCorrect: 55, answers: 11 }],
        hardestQuestions: [{ question: "Why rehash?", percentCorrect: 40, answers: 10 }],
        errorsLast7Days: 0,
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(overviewPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const first = await overviewGet(makeOverviewReq());
      expect(first.status).toBe(200);
      expect(await first.json()).toEqual(overviewPayload);

      const second = await overviewGet(makeOverviewReq());
      expect(second.status).toBe(200);
      expect(await second.json()).toEqual(overviewPayload);

      // Upstream n8n called only once due to 60s cache
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });
});

