import type {
  CatalogItem,
  ErrorLogEntry,
  ExecutionRun,
  ExecutionStep,
  PharmacyChatMessage,
  PharmacyDecisionResponse,
  PharmacyMessageResponse,
  PharmacyState,
  ReservationLine,
  TelegramCard,
  TelegramCardLine,
} from "./schemas";

// ---------------------------------------------------------------------------
// Seed Catalog (8 products matching Google Sheet schema & /docs/pharmacy)
// ---------------------------------------------------------------------------

export const SEED_CATALOG: CatalogItem[] = [
  {
    id: "P101",
    name: "Panadol",
    strength: "500mg",
    price_egp: 45,
    stock: 18,
    requires_rx: false,
    alternative_id: "P102",
  },
  {
    id: "P102",
    name: "Panadol Extra",
    strength: "500mg/65mg",
    price_egp: 58,
    stock: 12,
    requires_rx: false,
    alternative_id: "P101",
  },
  {
    id: "B103",
    name: "Brufen",
    strength: "400mg",
    price_egp: 62,
    stock: 10,
    requires_rx: false,
    alternative_id: "C105",
  },
  {
    id: "N104",
    name: "Antinal",
    strength: "200mg",
    price_egp: 54,
    stock: 15,
    requires_rx: false,
    alternative_id: null,
  },
  {
    id: "C105",
    name: "Cataflam",
    strength: "50mg",
    price_egp: 72,
    stock: 0,
    requires_rx: false,
    alternative_id: "B103",
  },
  {
    id: "A201",
    name: "Augmentin",
    strength: "1g",
    price_egp: 118,
    stock: 0,
    requires_rx: true,
    alternative_id: "A202",
  },
  {
    id: "A202",
    name: "Hibiotic",
    strength: "1g",
    price_egp: 96,
    stock: 9,
    requires_rx: true,
    alternative_id: "A201",
  },
  {
    id: "M203",
    name: "Concor",
    strength: "5mg",
    price_egp: 84,
    stock: 7,
    requires_rx: true,
    alternative_id: null,
  },
];

const ARABIC_NAMES: Record<string, string> = {
  P101: "بانادول 500 مجم",
  P102: "بانادول إكسترا 500/65 مجم",
  B103: "بروفين 400 مجم",
  N104: "أنتينال 200 مجم",
  C105: "كتافلام 50 مجم",
  A201: "أوجمنتين 1 جم",
  A202: "هايبيوتيك 1 جم",
  M203: "كونكور 5 مجم",
};

interface CatalogMatcherEntry {
  id: string;
  aliases: string[];
  strengthNumbers: string[];
}

// Ordered intentionally so multi-word "Panadol Extra" matches before "Panadol"
const MATCHER_ENTRIES: CatalogMatcherEntry[] = [
  {
    id: "P102",
    aliases: [
      "panadol extra",
      "panadolextra",
      "بانادول اكسترا",
      "بنادول اكسترا",
      "بانادول احمر",
    ],
    strengthNumbers: ["500", "65"],
  },
  {
    id: "P101",
    aliases: ["panadol", "panadool", "panadl", "بانادول", "بنادول"],
    strengthNumbers: ["500"],
  },
  {
    id: "B103",
    aliases: ["brufen", "brofen", "بروفين", "ابروفين"],
    strengthNumbers: ["400"],
  },
  {
    id: "N104",
    aliases: ["antinal", "antinall", "انتينال", "أنتينال"],
    strengthNumbers: ["200"],
  },
  {
    id: "C105",
    aliases: ["cataflam", "katflam", "كتافلام"],
    strengthNumbers: ["50"],
  },
  {
    id: "A201",
    aliases: ["augmentin", "ogmentin", "اوجمنتين", "أوجمنتين", "اوجمانتين"],
    strengthNumbers: ["1"],
  },
  {
    id: "A202",
    aliases: ["hibiotic", "hybiotic", "هايبيوتيك", "هايبوتيك", "هيبيوتيك"],
    strengthNumbers: ["1"],
  },
  {
    id: "M203",
    aliases: ["concor", "konkor", "كونكور"],
    strengthNumbers: ["5"],
  },
];

// ---------------------------------------------------------------------------
// Global in-memory store (persists across HMR in dev, serverless warm calls)
// ---------------------------------------------------------------------------

interface PharmacyStore {
  catalog: CatalogItem[];
  reservations: ReservationLine[];
  errors: ErrorLogEntry[];
  messages: PharmacyChatMessage[];
  telegram_cards: TelegramCard[];
  last_run: ExecutionRun | null;
  updated_at: string;
}

const globalForPharmacy = globalThis as unknown as {
  __dawaaPharmacyStore?: PharmacyStore;
};

function createFreshStore(): PharmacyStore {
  return {
    catalog: SEED_CATALOG.map((item) => ({ ...item })),
    reservations: [],
    errors: [],
    messages: [],
    telegram_cards: [],
    last_run: null,
    updated_at: new Date().toISOString(),
  };
}

function getStore(): PharmacyStore {
  if (!globalForPharmacy.__dawaaPharmacyStore) {
    globalForPharmacy.__dawaaPharmacyStore = createFreshStore();
  }
  return globalForPharmacy.__dawaaPharmacyStore;
}

function snapshotState(): PharmacyState {
  const s = getStore();
  return {
    mode: "mock",
    catalog: s.catalog.map((c) => ({ ...c })),
    reservations: s.reservations.map((r) => ({ ...r })),
    errors: s.errors.map((e) => ({ ...e })),
    messages: s.messages.map((m) => ({ ...m })),
    telegram_cards: s.telegram_cards.map((card) => ({
      ...card,
      lines: card.lines.map((l) => ({
        ...l,
        alternative: l.alternative ? { ...l.alternative } : null,
      })),
    })),
    last_run: s.last_run
      ? {
          ...s.last_run,
          steps: s.last_run.steps.map((st) => ({ ...st })),
        }
      : null,
    updated_at: s.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Helpers: IDs, Normalization, Fuzzy Matching
// ---------------------------------------------------------------------------

const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRequestId(now = new Date()): string {
  const yy = String(now.getUTCFullYear()).slice(-2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
  }
  return `R-${yy}${mm}${dd}-${suffix}`;
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function step(
  name: string,
  detail: string,
  status: ExecutionStep["status"] = "ok",
  duration_ms = 65
): ExecutionStep {
  return {
    id: uid("step"),
    name,
    detail,
    status,
    duration_ms,
  };
}

function normalizeText(raw: string): string {
  // Convert Arabic-Indic & Eastern Arabic digits to ASCII 0-9
  const digitsFixed = raw
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

  return digitsFixed
    .replace(/\([^)]*\)/g, " ") // strip helper hints like (typo)
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s,،+\n.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return dp[n];
}

interface MatchedSegment {
  rawText: string;
  item: CatalogItem;
  qty: number;
  aiLabel: string;
}

function parseQuantity(segment: string, strengthNumbers: string[]): number {
  // 1. Explicit multiplier form: x2, *2, ×2, 2x
  const afterMult = segment.match(/(?:^|\s)[x*×]\s*(\d{1,2})(?:\b|\s|$)/i);
  if (afterMult) {
    return Math.max(1, Math.min(20, Number(afterMult[1])));
  }
  const beforeMult = segment.match(/(?:^|\s)(\d{1,2})\s*[x*×](?:\b|\s|$)/i);
  if (beforeMult) {
    return Math.max(1, Math.min(20, Number(beforeMult[1])));
  }

  // 2. Standalone number not attached to mg/g/ml and not equal to catalog strength number
  const cleaned = segment.replace(/\b\d+\s*(mg|g|ml|mcg|مجم|جم)\b/gi, " ");
  const tokens = cleaned.match(/\b\d{1,3}\b/g);
  if (tokens) {
    for (const tok of tokens) {
      if (strengthNumbers.includes(tok)) continue;
      const n = Number(tok);
      if (n >= 1 && n <= 20) return n;
    }
  }

  return 1;
}

function matchCatalogSegment(
  segment: string,
  catalog: CatalogItem[]
): MatchedSegment | null {
  const normalized = normalizeText(segment);
  if (!normalized) return null;

  // 1. Direct alias / phrase match (ordered so Panadol Extra beats Panadol)
  for (const entry of MATCHER_ENTRIES) {
    for (const alias of entry.aliases) {
      if (normalized.includes(alias)) {
        const item = catalog.find((c) => c.id === entry.id);
        if (!item) continue;
        const qty = parseQuantity(normalized, entry.strengthNumbers);
        return {
          rawText: segment.trim(),
          item,
          qty,
          aiLabel: `${item.name} ${item.strength} x${qty}`,
        };
      }
    }
  }

  // 2. Token-level fuzzy match (Levenshtein <= 2 for tokens >= 4 chars)
  const words = normalized
    .split(/[\s,،+]+/)
    .filter((w) => w.length >= 4 && !/^\d+$/.test(w));

  let best: { entry: CatalogMatcherEntry; dist: number } | null = null;
  for (const word of words) {
    for (const entry of MATCHER_ENTRIES) {
      for (const alias of entry.aliases) {
        const aliasFirst = alias.split(" ")[0];
        if (aliasFirst.length < 4) continue;
        const dist = levenshtein(word, aliasFirst);
        if (dist <= 2 && (!best || dist < best.dist)) {
          best = { entry, dist };
        }
      }
    }
  }

  if (best) {
    const item = catalog.find((c) => c.id === best.entry.id);
    if (item) {
      const qty = parseQuantity(normalized, best.entry.strengthNumbers);
      return {
        rawText: segment.trim(),
        item,
        qty,
        aiLabel: `${item.name} ${item.strength} x${qty}`,
      };
    }
  }

  return null;
}

function isGreetingOnly(normalized: string): boolean {
  const greetings = [
    "hi",
    "hello",
    "hey",
    "salam",
    "marhaba",
    "اهلا",
    "مرحبا",
    "السلام عليكم",
    "هاي",
  ];
  return greetings.some(
    (g) => normalized === g || normalized.startsWith(`${g} `)
  );
}

function buildAlternativeInfo(
  item: CatalogItem,
  catalog: CatalogItem[]
) {
  if (!item.alternative_id) return null;
  const alt = catalog.find((c) => c.id === item.alternative_id);
  if (!alt) return null;
  return {
    id: alt.id,
    name: alt.name,
    strength: alt.strength,
    price_egp: alt.price_egp,
  };
}

function toTelegramLine(
  item: CatalogItem,
  qty: number,
  lineNo: number,
  catalog: CatalogItem[]
): TelegramCardLine {
  const inStock = item.stock >= qty;
  return {
    line_no: lineNo,
    medicine_id: item.id,
    medicine_name: `${item.name} ${item.strength}`,
    qty,
    price_egp: item.price_egp,
    stock: item.stock,
    in_stock: inStock,
    requires_rx: item.requires_rx,
    alternative: inStock ? null : buildAlternativeInfo(item, catalog),
  };
}

// ---------------------------------------------------------------------------
// Public API for API Route Handlers
// ---------------------------------------------------------------------------

export function getPharmacyState(): PharmacyState {
  return snapshotState();
}

export function resetPharmacyState(): PharmacyState {
  globalForPharmacy.__dawaaPharmacyStore = createFreshStore();
  return snapshotState();
}

export function processPharmacyMessage(input: {
  text: string;
  customer?: string;
  hasImage?: boolean;
  imageName?: string;
}): PharmacyMessageResponse {
  const store = getStore();
  const now = new Date();
  const nowIso = now.toISOString();
  const customer = input.customer?.trim() || "Youssef Adel (Demo)";
  const hasImage = Boolean(input.hasImage);
  const rawText = input.text.trim();

  // Record incoming customer WhatsApp bubble
  const displayCustomerText =
    rawText ||
    (hasImage
      ? `Uploaded prescription photo (${input.imageName || "rx-photo.png"})`
      : "");

  store.messages.push({
    id: uid("msg"),
    sender: "customer",
    text: displayCustomerText,
    image_name: hasImage ? input.imageName || "prescription.png" : null,
    timestamp: nowIso,
  });

  const steps: ExecutionStep[] = [
    step(
      "WhatsApp Trigger",
      hasImage
        ? `image · ${input.imageName || "rx-photo.png"}`
        : `text · "${rawText.slice(0, 42)}"`,
      "ok",
      45
    ),
    step(
      "Normalize Message",
      `customer=${customer} · type=${hasImage ? "image" : "text"}`,
      "ok",
      25
    ),
    step("Is Photo?", hasImage ? "true · prescription media attached" : "false · text request", "ok", 18),
  ];

  let matched: MatchedSegment[] = [];
  let isPrescription = hasImage;

  if (hasImage) {
    steps.push(
      step(
        "Prepare Image Read",
        "in-memory buffer -> Gemini 2.5 Flash vision (not persisted)",
        "ok",
        55
      )
    );

    // Check if caption or filename specifically names a known drug (e.g. Augmentin or Concor)
    const hintText = `${rawText} ${input.imageName ?? ""}`.replace(/[_-]/g, " ");
    const seg = matchCatalogSegment(hintText, store.catalog);
    const defaultItem =
      store.catalog.find((c) => c.id === "A202") ?? store.catalog[0];

    matched = seg
      ? [seg]
      : [
          {
            rawText: input.imageName || "prescription.png",
            item: defaultItem,
            qty: 1,
            aiLabel: `${defaultItem.name} ${defaultItem.strength} x1`,
          },
        ];

    const aiJson = JSON.stringify({
      is_prescription: true,
      medicines: matched.map((m) => m.aiLabel),
    });
    steps.push(step("AI Read Request", `Gemini 2.5 Flash -> ${aiJson}`, "ok", 310));
  } else {
    steps.push(step("Prepare Text Read", "cleaning digits, typos & Arabic forms", "ok", 22));

    const normalized = normalizeText(rawText);

    if (isGreetingOnly(normalized)) {
      const aiJson = JSON.stringify({ is_prescription: false, medicines: [] });
      steps.push(step("AI Read Request", `Gemini 2.5 Flash -> ${aiJson}`, "ok", 190));
      steps.push(step("Read Catalog", `${store.catalog.length} products loaded`, "ok", 40));
      steps.push(step("Route Request", "greeting · no medicines requested", "ok", 20));

      const replyEn =
        "Welcome to Dawaa Pharmacy! Send medicine names (e.g. Panadol 500 x2, Brufen 400) or upload a prescription photo.";
      const replyAr =
        "أهلاً بك في صيدلية دواء! ابعت أسماء الأدوية المطلوبة أو صورة الروشتة وسنقوم بالرد فوراً.";
      const combined = `${replyEn}\n${replyAr}`;

      store.messages.push({
        id: uid("msg"),
        sender: "bot",
        text: replyEn,
        text_ar: replyAr,
        request_id: null,
        timestamp: new Date().toISOString(),
      });

      const execution: ExecutionRun = {
        run_id: uid("run"),
        workflow: "customer-message",
        status: "succeeded",
        started_at: nowIso,
        steps,
      };
      store.last_run = execution;
      store.updated_at = new Date().toISOString();

      return {
        ok: true,
        request_id: null,
        reply: combined,
        execution,
        state: snapshotState(),
      };
    }

    // Split on comma, Arabic comma, plus, newline, 'and', 'و'
    const rawSegments = rawText
      .split(/[,،+\n]+|\s+and\s+|\s+و\s+/i)
      .map((s) => s.trim())
      .filter(Boolean);

    const seenIds = new Set<string>();
    for (const segText of rawSegments.length ? rawSegments : [rawText]) {
      const m = matchCatalogSegment(segText, store.catalog);
      if (m && !seenIds.has(m.item.id)) {
        seenIds.add(m.item.id);
        matched.push(m);
      }
    }

    const aiJson = JSON.stringify({
      is_prescription: matched.some((m) => m.item.requires_rx),
      medicines: matched.map((m) => m.aiLabel),
    });
    steps.push(step("AI Read Request", `Gemini 2.5 Flash -> ${aiJson}`, "ok", 260));
    isPrescription = matched.some((m) => m.item.requires_rx);
  }

  steps.push(step("Read Catalog", `${store.catalog.length} products read from Google Sheet`, "ok", 55));

  if (matched.length === 0) {
    steps.push(step("Match Catalog", `0 matches for "${rawText.slice(0, 32)}"`, "warn", 35));
    steps.push(step("Route Request", "unmatched item · logged for review", "warn", 25));

    store.errors.unshift({
      timestamp: nowIso,
      workflow: "customer-message",
      message: `Could not match requested medicine in catalog: "${rawText.slice(0, 80)}"`,
    });

    const replyEn =
      "I couldn't find that medicine in our catalog. Please check the spelling or try Panadol 500, Brufen 400, Antinal, or Augmentin 1g.";
    const replyAr =
      "لم نتمكن من العثور على هذا الدواء في الكتالوج. برجاء التأكد من الاسم أو إرسال صورة الروشتة.";
    const combined = `${replyEn}\n${replyAr}`;

    store.messages.push({
      id: uid("msg"),
      sender: "bot",
      text: replyEn,
      text_ar: replyAr,
      request_id: null,
      timestamp: new Date().toISOString(),
    });

    const execution: ExecutionRun = {
      run_id: uid("run"),
      workflow: "customer-message",
      status: "succeeded",
      started_at: nowIso,
      steps,
    };
    store.last_run = execution;
    store.updated_at = new Date().toISOString();

    return {
      ok: true,
      request_id: null,
      reply: combined,
      execution,
      state: snapshotState(),
    };
  }

  // Matched items found
  const matchSummary = matched
    .map((m) => `${m.item.id} (${m.item.name} ×${m.qty})`)
    .join(", ");
  steps.push(step("Match Catalog", `fuzzy/Arabic match -> ${matchSummary}`, "ok", 38));

  const requestId = generateRequestId(now);
  const expiresIso = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

  const needsPharmacist =
    hasImage || matched.some((m) => m.item.requires_rx);

  // Rule 2 & 3: Prescription needed (photo or requires_rx) -> Pharmacist review
  if (needsPharmacist) {
    steps.push(
      step(
        "Route Request",
        hasImage ? "rx photo -> pharmacist approval required" : "requires_rx=true -> pharmacist review",
        "ok",
        24
      )
    );
    steps.push(
      step(
        "One Row per Medicine",
        `${requestId} · ${matched.length} line(s) prepared`,
        "ok",
        20
      )
    );

    const newLines: ReservationLine[] = matched.map((m, idx) => ({
      request_id: requestId,
      line_no: idx + 1,
      customer,
      medicine_id: m.item.id,
      qty: m.qty,
      status: "pending",
      created_at: nowIso,
      expires_at: expiresIso,
    }));

    store.reservations.unshift(...newLines);
    steps.push(
      step(
        "Save Reservation Lines",
        `${newLines.length} row(s) written as status=pending`,
        "ok",
        70
      )
    );
    steps.push(
      step(
        "Auto or Pharmacist?",
        "Pharmacist -> stock NOT deducted yet",
        "ok",
        18
      )
    );

    const cardLines = matched.map((m, idx) =>
      toTelegramLine(m.item, m.qty, idx + 1, store.catalog)
    );
    const hasOutOfStock = cardLines.some((l) => !l.in_stock);

    const card: TelegramCard = {
      id: uid("tg"),
      request_id: requestId,
      customer,
      is_prescription: isPrescription,
      source_summary: hasImage
        ? `Rx Photo (${input.imageName || "prescription.png"})`
        : rawText,
      status: "pending",
      decided_by: null,
      decision_note: null,
      created_at: nowIso,
      decided_at: null,
      lines: cardLines,
    };

    store.telegram_cards.unshift(card);

    steps.push(
      step(
        "Post Telegram Card",
        hasOutOfStock
          ? `Dawaa Pharmacists -> ${requestId} (out-of-stock + alternative flagged)`
          : `Dawaa Pharmacists -> ${requestId} (Approve / Reject ready)`,
        hasOutOfStock ? "warn" : "ok",
        65
      )
    );

    const replyEn =
      "Our pharmacist is reviewing your request and will confirm shortly.";
    const replyAr =
      "يقوم الصيدلي بمراجعة طلبك الآن وسيتم تأكيده خلال لحظات.";
    const combined = `${replyEn}\n${replyAr}`;

    store.messages.push({
      id: uid("msg"),
      sender: "bot",
      text: replyEn,
      text_ar: replyAr,
      request_id: requestId,
      timestamp: new Date().toISOString(),
    });

    const execution: ExecutionRun = {
      run_id: uid("run"),
      workflow: "customer-message",
      status: "succeeded",
      started_at: nowIso,
      steps,
    };
    store.last_run = execution;
    store.updated_at = new Date().toISOString();

    return {
      ok: true,
      request_id: requestId,
      reply: combined,
      execution,
      state: snapshotState(),
    };
  }

  // Non-Rx flow (Rules 1 & 4)
  const inStockItems = matched.filter((m) => m.item.stock >= m.qty);
  const outOfStockItems = matched.filter((m) => m.item.stock < m.qty);

  // Rule 4 only: all non-Rx items out of stock
  if (inStockItems.length === 0) {
    steps.push(
      step("Route Request", "no_rx & out of stock -> suggest alternative", "warn", 24)
    );
    steps.push(step("One Row per Medicine", "0 reservable lines", "warn", 15));
    steps.push(step("Save Reservation Lines", "skipped · unavailable stock", "warn", 15));
    steps.push(step("Auto or Pharmacist?", "Auto reply with alternative", "ok", 16));

    const suggestionsEn = outOfStockItems.map((m) => {
      const alt = buildAlternativeInfo(m.item, store.catalog);
      return alt
        ? `${m.item.name} ${m.item.strength} is currently out of stock. Suggested alternative: ${alt.name} ${alt.strength} (${alt.id}) — ${alt.price_egp} EGP.`
        : `${m.item.name} ${m.item.strength} is currently out of stock.`;
    });

    const suggestionsAr = outOfStockItems.map((m) => {
      const alt = buildAlternativeInfo(m.item, store.catalog);
      const arName = ARABIC_NAMES[m.item.id] ?? `${m.item.name} ${m.item.strength}`;
      const arAltName = alt ? ARABIC_NAMES[alt.id] ?? `${alt.name} ${alt.strength}` : "";
      return alt
        ? `${arName} غير متوفر حالياً. البديل المتاح: ${arAltName} (${alt.id}) — ${alt.price_egp} ج.م.`
        : `${arName} غير متوفر حالياً.`;
    });

    const replyEn = suggestionsEn.join(" ");
    const replyAr = suggestionsAr.join(" ");
    const combined = `${replyEn}\n${replyAr}`;

    store.messages.push({
      id: uid("msg"),
      sender: "bot",
      text: replyEn,
      text_ar: replyAr,
      request_id: null,
      timestamp: new Date().toISOString(),
    });

    const execution: ExecutionRun = {
      run_id: uid("run"),
      workflow: "customer-message",
      status: "succeeded",
      started_at: nowIso,
      steps,
    };
    store.last_run = execution;
    store.updated_at = new Date().toISOString();

    return {
      ok: true,
      request_id: null,
      reply: combined,
      execution,
      state: snapshotState(),
    };
  }

  // Rule 1: Auto-reserve in-stock non-Rx items
  steps.push(
    step(
      "Route Request",
      "no_rx & in_stock -> Auto Reserve",
      "ok",
      24
    )
  );
  steps.push(
    step(
      "One Row per Medicine",
      `${requestId} · ${inStockItems.length} line(s)`,
      "ok",
      20
    )
  );

  const reservedLines: ReservationLine[] = inStockItems.map((m, idx) => ({
    request_id: requestId,
    line_no: idx + 1,
    customer,
    medicine_id: m.item.id,
    qty: m.qty,
    status: "reserved",
    created_at: nowIso,
    expires_at: expiresIso,
  }));

  store.reservations.unshift(...reservedLines);
  steps.push(
    step(
      "Save Reservation Lines",
      `${reservedLines.length} row(s) written as status=reserved`,
      "ok",
      60
    )
  );
  steps.push(step("Auto or Pharmacist?", "Auto -> deduct stock immediately", "ok", 18));

  const deductedNotes: string[] = [];
  for (const m of inStockItems) {
    const cat = store.catalog.find((c) => c.id === m.item.id);
    if (cat) {
      cat.stock = Math.max(0, cat.stock - m.qty);
      deductedNotes.push(`${cat.id}: ${cat.stock + m.qty}->${cat.stock}`);
    }
  }

  steps.push(step("Take Stock Now", `delta prepared · ${deductedNotes.join(", ")}`, "ok", 30));
  steps.push(step("Update Stock", `Google Sheet Catalog synced (${deductedNotes.join(", ")})`, "ok", 75));

  const enParts = inStockItems.map(
    (m) => `${m.qty} x ${m.item.name} ${m.item.strength} = ${m.qty * m.item.price_egp} EGP`
  );
  const arParts = inStockItems.map((m) => {
    const arName = ARABIC_NAMES[m.item.id] ?? `${m.item.name} ${m.item.strength}`;
    return `${m.qty} × ${arName} = ${m.qty * m.item.price_egp} ج.م`;
  });

  let replyEn = `Reserved for 2 hours (${requestId}): ${enParts.join(", ")}. Pick up from the pharmacy.`;
  let replyAr = `تم الحجز لمدة ساعتين (${requestId}): ${arParts.join("، ")}. الاستلام من الصيدلية.`;

  if (outOfStockItems.length > 0) {
    const unavailEn = outOfStockItems.map((m) => {
      const alt = buildAlternativeInfo(m.item, store.catalog);
      return alt
        ? `${m.item.name} ${m.item.strength} is out of stock (alternative: ${alt.name} ${alt.strength} ${alt.id} · ${alt.price_egp} EGP)`
        : `${m.item.name} ${m.item.strength} is out of stock`;
    });
    replyEn += ` Note: ${unavailEn.join("; ")}.`;
    replyAr += ` ملاحظة: بعض الأصناف غير متوفرة واقترحنا بديلاً.`;
  }

  const combined = `${replyEn}\n${replyAr}`;

  store.messages.push({
    id: uid("msg"),
    sender: "bot",
    text: replyEn,
    text_ar: replyAr,
    request_id: requestId,
    timestamp: new Date().toISOString(),
  });

  steps.push(step("Reply WhatsApp", `sent confirmation (${requestId})`, "ok", 40));

  const execution: ExecutionRun = {
    run_id: uid("run"),
    workflow: "customer-message",
    status: "succeeded",
    started_at: nowIso,
    steps,
  };
  store.last_run = execution;
  store.updated_at = new Date().toISOString();

  return {
    ok: true,
    request_id: requestId,
    reply: combined,
    execution,
    state: snapshotState(),
  };
}

export function processPharmacyDecision(input: {
  callback_data: string;
  pharmacist?: string;
  reason?: string;
}): PharmacyDecisionResponse {
  const store = getStore();
  const now = new Date();
  const nowIso = now.toISOString();
  const pharmacist = input.pharmacist?.trim() || "pharmacist_hala";

  const [, action, requestId] = input.callback_data.split(":") as [
    string,
    "approve" | "reject",
    string,
  ];

  const steps: ExecutionStep[] = [
    step("Telegram Trigger", `callback=${input.callback_data}`, "ok", 42),
    step("Parse Decision", `action=${action} · request_id=${requestId}`, "ok", 22),
  ];

  const pendingLines = store.reservations.filter(
    (r) => r.request_id === requestId && r.status === "pending"
  );
  const card = store.telegram_cards.find((c) => c.request_id === requestId);

  steps.push(
    step(
      "Find Pending Lines",
      `${pendingLines.length} pending row(s) found`,
      pendingLines.length > 0 ? "ok" : "warn",
      50
    )
  );
  steps.push(
    step(
      "Read Catalog (Decision)",
      `${store.catalog.length} products loaded`,
      "ok",
      55
    )
  );

  if (pendingLines.length === 0 || !card || card.status !== "pending") {
    const msg = card
      ? `Request ${requestId} was already ${card.status}.`
      : `No pending request found for ${requestId}.`;
    steps.push(step("Apply Decision", "skipped · no pending lines", "warn", 20));
    steps.push(step("Answer Pharmacist", `toast: "${msg}"`, "warn", 30));
    steps.push(step("Decision OK?", "false · request already finalized", "warn", 15));

    const execution: ExecutionRun = {
      run_id: uid("run"),
      workflow: "pharmacist-decision",
      status: "failed",
      started_at: nowIso,
      steps,
    };
    store.last_run = execution;
    store.updated_at = nowIso;

    return {
      ok: true,
      decision_ok: false,
      toast: msg,
      execution,
      state: snapshotState(),
    };
  }

  // Stock check guard on Approve (Rule 3)
  if (action === "approve") {
    for (const line of pendingLines) {
      const cat = store.catalog.find((c) => c.id === line.medicine_id);
      if (!cat || cat.stock < line.qty) {
        const medLabel = cat
          ? `${cat.name} ${cat.strength}`
          : line.medicine_id;
        const blockMsg = `Not enough stock for ${medLabel}. Edit the request or reject.`;

        steps.push(
          step(
            "Apply Decision",
            `blocked · ${medLabel} stock=${cat?.stock ?? 0}, needed=${line.qty}`,
            "error",
            30
          )
        );
        steps.push(step("Answer Pharmacist", `toast: "${blockMsg}"`, "error", 35));
        steps.push(
          step(
            "Decision OK?",
            "false · insufficient stock guard triggered",
            "error",
            18
          )
        );

        store.errors.unshift({
          timestamp: nowIso,
          workflow: "pharmacist-decision",
          message: blockMsg,
        });

        const execution: ExecutionRun = {
          run_id: uid("run"),
          workflow: "pharmacist-decision",
          status: "failed",
          started_at: nowIso,
          steps,
        };
        store.last_run = execution;
        store.updated_at = nowIso;

        return {
          ok: true,
          decision_ok: false,
          toast: blockMsg,
          execution,
          state: snapshotState(),
        };
      }
    }
  }

  const isApprove = action === "approve";
  const toast = isApprove
    ? `Approved ${requestId} by ${pharmacist}`
    : `Rejected ${requestId}`;

  steps.push(
    step(
      "Apply Decision",
      isApprove
        ? `validated stock for ${pendingLines.length} line(s)`
        : `preparing rejection by ${pharmacist}`,
      "ok",
      30
    )
  );
  steps.push(step("Answer Pharmacist", `toast: "${toast}"`, "ok", 35));
  steps.push(step("Decision OK?", "true · proceeding with updates", "ok", 18));

  const nextStatus = isApprove ? "reserved" : "rejected";
  const newExpiry = isApprove
    ? new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString()
    : "";

  for (const line of pendingLines) {
    line.status = nextStatus;
    line.expires_at = newExpiry;
  }

  steps.push(
    step(
      "Line Updates",
      `${pendingLines.length} row(s) -> status=${nextStatus}`,
      "ok",
      24
    )
  );
  steps.push(
    step("Update Lines", `Google Sheet Reservations updated (${requestId})`, "ok", 72)
  );

  card.status = isApprove ? "approved" : "rejected";
  card.decided_by = isApprove ? pharmacist : null;
  card.decision_note = isApprove
    ? `Approved by ${pharmacist}`
    : input.reason?.trim() || "Rejected";
  card.decided_at = nowIso;

  steps.push(
    step(
      "Mark Message Done",
      `Telegram card updated -> "${card.decision_note}"`,
      "ok",
      45
    )
  );
  steps.push(
    step("Approved?", isApprove ? "true · deduct stock now" : "false · skip stock deduction", "ok", 18)
  );

  if (isApprove) {
    const stockUpdates: string[] = [];
    for (const line of pendingLines) {
      const cat = store.catalog.find((c) => c.id === line.medicine_id);
      if (cat) {
        cat.stock = Math.max(0, cat.stock - line.qty);
        stockUpdates.push(`${cat.id}: ${cat.stock + line.qty}->${cat.stock}`);
      }
    }

    steps.push(step("Stock Rows", stockUpdates.join(", "), "ok", 22));
    steps.push(step("Take Stock (Approved)", `Google Sheet Catalog synced (${stockUpdates.join(", ")})`, "ok", 70));

    const summaryEn = pendingLines
      .map((l) => {
        const cat = store.catalog.find((c) => c.id === l.medicine_id);
        return cat
          ? `${l.qty} x ${cat.name} ${cat.strength} = ${l.qty * cat.price_egp} EGP`
          : `${l.qty} x ${l.medicine_id}`;
      })
      .join(", ");
    const summaryAr = pendingLines
      .map((l) => {
        const cat = store.catalog.find((c) => c.id === l.medicine_id);
        const arName =
          ARABIC_NAMES[l.medicine_id] ??
          (cat ? `${cat.name} ${cat.strength}` : l.medicine_id);
        return cat
          ? `${l.qty} × ${arName} = ${l.qty * cat.price_egp} ج.م`
          : `${l.qty} × ${arName}`;
      })
      .join("، ");

    const replyEn = `Approved by pharmacist! Reserved for 2 hours (${requestId}): ${summaryEn}. Pick up from the pharmacy.`;
    const replyAr = `تمت موافقة الصيدلي! تم الحجز لمدة ساعتين (${requestId}): ${summaryAr}. الاستلام من الصيدلية.`;

    store.messages.push({
      id: uid("msg"),
      sender: "bot",
      text: replyEn,
      text_ar: replyAr,
      request_id: requestId,
      timestamp: nowIso,
    });
  } else {
    // Reject path: mention alternative if any item was out of stock
    const outLines = card.lines.filter((l) => !l.in_stock && l.alternative);
    const altNoteEn = outLines.length
      ? ` Suggested alternative: ${outLines
          .map((l) => `${l.alternative!.name} ${l.alternative!.strength} (${l.alternative!.id}) — ${l.alternative!.price_egp} EGP`)
          .join(", ")}.`
      : "";
    const altNoteAr = outLines.length
      ? ` البديل المقترح: ${outLines
          .map((l) => `${ARABIC_NAMES[l.alternative!.id] ?? l.alternative!.name} (${l.alternative!.id}) — ${l.alternative!.price_egp} ج.م`)
          .join("، ")}.`
      : "";

    const reasonText = input.reason?.trim()
      ? ` Reason: ${input.reason.trim()}.`
      : outLines.length
        ? " Requested medicine is currently out of stock."
        : " Please consult our pharmacist in-store with a valid prescription.";

    const replyEn = `Update on ${requestId}: the pharmacist could not approve this request.${reasonText}${altNoteEn}`;
    const replyAr = `تحديث بخصوص الطلب (${requestId}): لم يتمكن الصيدلي من اعتماد الطلب حالياً.${altNoteAr}`;

    store.messages.push({
      id: uid("msg"),
      sender: "bot",
      text: replyEn,
      text_ar: replyAr,
      request_id: requestId,
      timestamp: nowIso,
    });
  }

  steps.push(
    step(
      "Tell Customer",
      `WhatsApp ${isApprove ? "approval confirmation" : "rejection notice"} sent`,
      "ok",
      45
    )
  );

  const execution: ExecutionRun = {
    run_id: uid("run"),
    workflow: "pharmacist-decision",
    status: "succeeded",
    started_at: nowIso,
    steps,
  };
  store.last_run = execution;
  store.updated_at = nowIso;

  return {
    ok: true,
    decision_ok: true,
    toast,
    execution,
    state: snapshotState(),
  };
}
