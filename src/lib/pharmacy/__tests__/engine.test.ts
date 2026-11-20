import { beforeEach, describe, expect, it } from "vitest";
import {
  getPharmacyState,
  processPharmacyDecision,
  processPharmacyMessage,
  resetPharmacyState,
} from "../engine";
import {
  PharmacyDecisionResponseSchema,
  PharmacyMessageResponseSchema,
  PharmacyStateSchema,
} from "../schemas";

describe("Dawaa Pharmacy Workflow Engine", () => {
  beforeEach(() => {
    resetPharmacyState();
  });

  it("Rule 1: auto-reserves non-Rx in-stock request and deducts stock immediately", () => {
    const res = processPharmacyMessage({ text: "Panadol 500 x2" });
    expect(PharmacyMessageResponseSchema.safeParse(res).success).toBe(true);
    expect(res.request_id).toMatch(/^R-\d{6}-[A-Z0-9]{4}$/);
    expect(res.reply).toContain("Reserved for 2 hours");
    expect(res.reply).toContain("2 x Panadol 500mg = 90 EGP");

    const panadol = res.state.catalog.find((c) => c.id === "P101");
    expect(panadol?.stock).toBe(16);
    expect(res.state.reservations).toHaveLength(1);
    expect(res.state.reservations[0].status).toBe("reserved");
    expect(res.state.telegram_cards).toHaveLength(0);
  });

  it("matches Arabic requests with Arabic numerals accurately (Panadol Extra vs Panadol)", () => {
    const res = processPharmacyMessage({ text: "عايز ٢ بانادول اكسترا" });
    expect(PharmacyMessageResponseSchema.safeParse(res).success).toBe(true);
    expect(res.state.reservations).toHaveLength(1);
    expect(res.state.reservations[0].medicine_id).toBe("P102");
    expect(res.state.reservations[0].qty).toBe(2);
    expect(res.reply).toContain("2 x Panadol Extra 500mg/65mg = 116 EGP");
  });

  it("handles misspelled drug names via fuzzy matching", () => {
    const res = processPharmacyMessage({ text: "Panadool (typo)" });
    expect(res.state.reservations).toHaveLength(1);
    expect(res.state.reservations[0].medicine_id).toBe("P101");
    expect(res.state.reservations[0].qty).toBe(1);
  });

  it("splits multi-medicine messages into separate reservation lines", () => {
    const res = processPharmacyMessage({ text: "Brufen 400, Antinal" });
    expect(res.state.reservations).toHaveLength(2);
    expect(res.state.reservations[0].request_id).toBe(res.state.reservations[1].request_id);
    expect(res.state.reservations.map((r) => r.line_no)).toEqual([1, 2]);
    expect(res.state.catalog.find((c) => c.id === "B103")?.stock).toBe(9);
    expect(res.state.catalog.find((c) => c.id === "N104")?.stock).toBe(14);
  });

  it("Rule 2: routes prescription photo to Telegram pending review without deducting stock until approved", () => {
    const msgRes = processPharmacyMessage({
      text: "",
      hasImage: true,
      imageName: "sample-rx-prescription.png",
    });
    expect(PharmacyMessageResponseSchema.safeParse(msgRes).success).toBe(true);
    expect(msgRes.reply).toContain("Our pharmacist is reviewing your request and will confirm shortly.");

    // Stock NOT deducted yet for Hibiotic (A202 stock=9)
    expect(msgRes.state.catalog.find((c) => c.id === "A202")?.stock).toBe(9);
    expect(msgRes.state.reservations[0].status).toBe("pending");
    expect(msgRes.state.telegram_cards).toHaveLength(1);

    const requestId = msgRes.request_id!;
    const approveRes = processPharmacyDecision({
      callback_data: `ph:approve:${requestId}`,
      pharmacist: "pharmacist_hala",
    });
    expect(PharmacyDecisionResponseSchema.safeParse(approveRes).success).toBe(true);
    expect(approveRes.decision_ok).toBe(true);
    expect(approveRes.state.catalog.find((c) => c.id === "A202")?.stock).toBe(8);
    expect(approveRes.state.reservations[0].status).toBe("reserved");
    expect(approveRes.state.telegram_cards[0].decision_note).toBe("Approved by pharmacist_hala");
  });

  it("Rule 3: blocks Approve on out-of-stock Rx with alternative hint while allowing Reject", () => {
    const msgRes = processPharmacyMessage({ text: "Augmentin 1g" });
    const card = msgRes.state.telegram_cards[0];
    expect(card.lines[0].in_stock).toBe(false);
    expect(card.lines[0].alternative?.id).toBe("A202");
    expect(card.lines[0].alternative?.price_egp).toBe(96);

    const requestId = msgRes.request_id!;
    const blockedApprove = processPharmacyDecision({
      callback_data: `ph:approve:${requestId}`,
    });
    expect(blockedApprove.decision_ok).toBe(false);
    expect(blockedApprove.toast).toBe(
      "Not enough stock for Augmentin 1g. Edit the request or reject."
    );
    expect(blockedApprove.state.telegram_cards[0].status).toBe("pending");
    expect(blockedApprove.state.errors).toHaveLength(1);

    const rejectRes = processPharmacyDecision({
      callback_data: `ph:reject:${requestId}`,
    });
    expect(rejectRes.decision_ok).toBe(true);
    expect(rejectRes.state.telegram_cards[0].status).toBe("rejected");
    expect(rejectRes.state.reservations[0].status).toBe("rejected");
  });

  it("Rule 4: informs customer of unavailable non-Rx item and suggests alternative", () => {
    const res = processPharmacyMessage({ text: "Cataflam 50" });
    expect(res.request_id).toBeNull();
    expect(res.reply).toContain("out of stock");
    expect(res.reply).toContain("Brufen 400mg (B103)");
    expect(res.state.reservations).toHaveLength(0);
  });

  it("handles greetings cleanly and reset restores seed stock", () => {
    const hi = processPharmacyMessage({ text: "Hi" });
    expect(hi.request_id).toBeNull();
    expect(hi.reply).toContain("Welcome to Dawaa Pharmacy");

    processPharmacyMessage({ text: "Panadol 500 x2" });
    expect(getPharmacyState().catalog.find((c) => c.id === "P101")?.stock).toBe(16);

    const reset = resetPharmacyState();
    expect(PharmacyStateSchema.safeParse(reset).success).toBe(true);
    expect(reset.catalog.find((c) => c.id === "P101")?.stock).toBe(18);
    expect(reset.reservations).toHaveLength(0);
    expect(reset.messages).toHaveLength(0);
    expect(reset.telegram_cards).toHaveLength(0);
  });
});
