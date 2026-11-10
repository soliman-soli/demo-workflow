import { describe, expect, it } from "vitest";
import {
  ActionRequestSchema,
  ApplyRequestSchema,
  CandidatesResponseSchema,
  ChatRequestSchema,
  ChatResponseSchema,
  CoachResponseSchema,
  isLinkedInUrl,
} from "../schemas";
import { MOCK_CHAT_RESPONSE, MOCK_COACH_REPORT, getMockCandidates } from "../mocks";

describe("HR Zod Schemas", () => {
  it("validates a valid ChatRequest and rejects messages over 1000 chars", () => {
    const valid = ChatRequestSchema.safeParse({
      message: "How many annual leave days do I get?",
      company: "Demo Co",
      history: [{ role: "user", content: "Hi" }],
    });
    expect(valid.success).toBe(true);

    const tooLong = ChatRequestSchema.safeParse({
      message: "a".repeat(1001),
      company: "Demo Co",
      history: [],
    });
    expect(tooLong.success).toBe(false);
  });

  it("validates ChatResponse mock data", () => {
    const parsed = ChatResponseSchema.safeParse(MOCK_CHAT_RESPONSE);
    expect(parsed.success).toBe(true);
  });

  it("validates CoachResponse mock report", () => {
    const parsed = CoachResponseSchema.safeParse(MOCK_COACH_REPORT);
    expect(parsed.success).toBe(true);
  });

  it("validates LinkedIn URLs and ApplyRequestSchema", () => {
    expect(isLinkedInUrl("https://www.linkedin.com/in/soliman")).toBe(true);
    expect(isLinkedInUrl("linkedin.com/in/soliman")).toBe(true);
    expect(isLinkedInUrl("https://example.com/linkedin.com")).toBe(false);

    const good = ApplyRequestSchema.safeParse({
      name: "Soliman",
      email: "soliman@example.com",
      linkedin: "https://www.linkedin.com/in/soliman",
      role_id: "role-swe-cairo",
    });
    expect(good.success).toBe(true);

    const bad = ApplyRequestSchema.safeParse({
      name: "Soliman",
      email: "not-an-email",
      linkedin: "https://github.com/soliman",
      role_id: "",
    });
    expect(bad.success).toBe(false);
  });

  it("validates CandidatesResponse mock data and ensures auto-rejected candidate has no interview questions", () => {
    const mock = getMockCandidates();
    const parsed = CandidatesResponseSchema.safeParse(mock);
    expect(parsed.success).toBe(true);

    const autoRejected = mock.candidates.find((c) => c.status === "rejected");
    expect(autoRejected).toBeDefined();
    expect(autoRejected?.interview_questions).toHaveLength(0);
  });

  it("validates CandidatesResponse when pipeline is empty and avg_score is null", () => {
    const empty = CandidatesResponseSchema.safeParse({
      stats: { total: 0, review: 0, shortlisted: 0, rejected: 0, interview_invited: 0, avg_score: null },
      candidates: [],
    });
    expect(empty.success).toBe(true);
    if (empty.success) {
      expect(empty.data.stats.avg_score).toBe(0);
    }
  });

  it("validates ActionRequestSchema", () => {
    const invite = ActionRequestSchema.safeParse({
      candidate_id: "cand-001",
      action: "invite_interview",
      interview_at: "Sun 9 Nov 2026, 11:00 (Cairo time)",
      mode: "online",
      location: "https://meet.google.com/abc-defg-hij",
    });
    expect(invite.success).toBe(true);
  });
});

