import type {
  DaysForward,
  MozakraGradeItemResult,
  MozakraGradeSuccess,
  MozakraLiveQuestion,
  MozakraLiveQuiz,
  MozakraStartClientSuccess,
  MozakraStateCard,
  MozakraStateSuccess,
  OptionKey,
} from "./schemas";

export const SAMPLE_LECTURE_TEXT = `Lecture 6: Hash Tables and Collision Resolution

A hash table maps keys to values by applying a deterministic hash function h(key) and indexing into an underlying bucket array via h(key) mod capacity. When the hash function distributes keys uniformly and the load factor (alpha = n / m, where n is the number of stored entries and m is the number of buckets) stays low, lookup, insertion, and deletion run in O(1) average time.

Because the space of possible keys is larger than the number of buckets, collisions are inevitable. Two primary strategies resolve collisions:
1. Separate chaining: each bucket stores a secondary collection (typically a linked list or small balanced tree) holding all entries that hashed to that index.
2. Open addressing: all entries live directly inside the bucket array. On collision, the table probes alternative slots (linear probing, quadratic probing, or double hashing) until an empty slot is found. As alpha approaches 1 in open addressing, clustering lengthens probe chains and insertions fail when the array is full.

To preserve O(1) average performance, hash tables resize once alpha exceeds a threshold (commonly 0.75). Resizing allocates a larger array and rehashes every existing key because each key's bucket index depends on the new capacity. In the worst case, a poor hash function that maps all n keys into a single bucket degrades lookup time to O(n).`;

interface OfflineQuestionInternal extends MozakraLiveQuestion {
  correct: OptionKey;
  explanation: string;
}

const OFFLINE_QUESTIONS: readonly OfflineQuestionInternal[] = [
  {
    questionId: "q1",
    topic: "Complexity",
    question:
      "What is the average-case time complexity of searching for a key in a well-sized hash table?",
    options: {
      A: "O(1)",
      B: "O(log n)",
      C: "O(n)",
      D: "O(n log n)",
    },
    correct: "A",
    explanation:
      "Computing the hash and indexing into the bucket array takes constant time on average when the load factor stays low.",
  },
  {
    questionId: "q2",
    topic: "Separate chaining",
    question:
      "In separate chaining, how does a hash table store two distinct keys that hash to the same bucket index?",
    options: {
      A: "It overwrites the older key with the newer key.",
      B: "It stores both entries in a bucket structure such as a linked list at that index.",
      C: "It doubles the array size before inserting the second key.",
      D: "It rejects the colliding key with an error.",
    },
    correct: "B",
    explanation:
      "Separate chaining maintains a collection per bucket so multiple colliding entries coexist at the same index.",
  },
  {
    questionId: "q3",
    topic: "Open addressing",
    question:
      "What happens as the load factor approaches 1 in an open-addressing hash table?",
    options: {
      A: "Lookups speed up because slots are adjacent.",
      B: "Hash functions stop being deterministic.",
      C: "Probe sequences lengthen due to clustering and insertions fail once full.",
      D: "Memory usage drops to O(1).",
    },
    correct: "C",
    explanation:
      "Open addressing stores all entries inside the array itself; high load creates clustering and leaves no empty slots.",
  },
  {
    questionId: "q4",
    topic: "Rehashing",
    question:
      "Why must a hash table rehash existing keys when resizing its underlying array?",
    options: {
      A: "Keys expire after resizing.",
      B: "Bucket indices depend on table capacity (hash(key) mod capacity).",
      C: "Hash values become negative on larger arrays.",
      D: "Rehashing sorts keys alphabetically.",
    },
    correct: "B",
    explanation:
      "Changing the bucket count changes hash(key) mod capacity, so every key must be placed in its new index.",
  },
  {
    questionId: "q5",
    topic: "Worst case",
    question:
      "Which condition leads to O(n) worst-case lookup time in a chaining-based hash table?",
    options: {
      A: "The table has more buckets than keys.",
      B: "Keys are short ASCII strings.",
      C: "A poor hash function maps all keys into a single bucket.",
      D: "Keys are inserted in random order.",
    },
    correct: "C",
    explanation:
      "If every key lands in the same bucket, lookup degrades into a linear scan over all n entries.",
  },
];

const BOX_INTERVALS: Record<1 | 2 | 3 | 4, { days: number; label: string }> = {
  1: { days: 1, label: "tomorrow" },
  2: { days: 3, label: "in 3 days" },
  3: { days: 7, label: "in 7 days" },
  4: { days: 14, label: "in 14 days" },
};

function addDays(isoDate: string, days: number): string {
  const dt = new Date(`${isoDate}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function toPublicQuestion(q: OfflineQuestionInternal): MozakraLiveQuestion {
  return {
    questionId: q.questionId,
    topic: q.topic,
    question: q.question,
    options: { ...q.options },
  };
}

export interface OfflineSessionData {
  simDate: string;
  cards: MozakraStateCard[];
  quizzes: { date: string; status: string; score: number | null; total: number }[];
}

export function createOfflineStart(): {
  start: MozakraStartClientSuccess;
  session: OfflineSessionData;
  state: MozakraStateSuccess;
} {
  const today = new Date().toISOString().slice(0, 10);
  const quiz: MozakraLiveQuiz = {
    token: "00000000000000000000000000000001",
    total: OFFLINE_QUESTIONS.length,
    questions: OFFLINE_QUESTIONS.map(toPublicQuestion),
  };

  const cards: MozakraStateCard[] = OFFLINE_QUESTIONS.map((q) => ({
    questionId: q.questionId,
    box: 1,
    nextReview: today,
    lastResult: null,
    timesSeen: 0,
    topic: q.topic,
    question: q.question,
  }));

  const session: OfflineSessionData = {
    simDate: today,
    cards,
    quizzes: [{ date: today, status: "sent", score: null, total: quiz.total }],
  };

  return {
    start: {
      ok: true,
      status: 200,
      lectureId: "offline-hash-tables",
      simDate: today,
      summary:
        "Hash tables achieve O(1) average-case lookup by mapping keys to bucket indices with a deterministic hash function. Collisions are resolved via separate chaining or open addressing, and resizing requires rehashing all entries when the load factor grows too high.",
      terms: [
        {
          term: "Load factor (α = n / m)",
          definition:
            "Ratio of stored entries (n) to bucket capacity (m); resizing typically triggers above 0.75.",
        },
        {
          term: "Separate chaining",
          definition:
            "Stores colliding entries in a per-bucket collection such as a linked list.",
        },
        {
          term: "Open addressing",
          definition:
            "Resolves collisions by probing for another empty slot inside the same bucket array.",
        },
        {
          term: "Rehashing",
          definition:
            "Recomputing bucket indices for every key after resizing because indices depend on capacity.",
        },
      ],
      dropped: [
        { n: 3, why: 'contains banned option "All of the above"' },
        { n: 7, why: "duplicate options B and D" },
      ],
      validCount: OFFLINE_QUESTIONS.length,
      quiz,
    },
    session,
    state: buildOfflineState(session),
  };
}

export function buildOfflineState(
  session: OfflineSessionData
): MozakraStateSuccess {
  const counts: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0 };
  for (const c of session.cards) {
    counts[String(c.box)] = (counts[String(c.box)] ?? 0) + 1;
  }
  return {
    ok: true,
    simDate: session.simDate,
    boxCounts: counts,
    cards: session.cards.map((c) => ({ ...c })),
    quizzes: session.quizzes.map((q) => ({ ...q })),
  };
}

export function gradeOfflineSession(
  session: OfflineSessionData,
  quiz: MozakraLiveQuiz,
  answers: Record<string, OptionKey>
): {
  grade: MozakraGradeSuccess;
  nextSession: OfflineSessionData;
  state: MozakraStateSuccess;
} {
  let score = 0;
  const updatedCards = session.cards.map((c) => ({ ...c }));

  const results: MozakraGradeItemResult[] = quiz.questions.map((pubQ) => {
    const full = OFFLINE_QUESTIONS.find((q) => q.questionId === pubQ.questionId)!;
    const card = updatedCards.find((c) => c.questionId === pubQ.questionId)!;
    const chosen = answers[pubQ.questionId] ?? null;
    const isCorrect = chosen === full.correct;
    if (isCorrect) score += 1;

    const previousBox = card.box as 1 | 2 | 3 | 4;
    const newBox = (isCorrect ? Math.min(4, previousBox + 1) : 1) as
      | 1
      | 2
      | 3
      | 4;
    const schedule = BOX_INTERVALS[newBox];
    const nextReviewDate = addDays(session.simDate, schedule.days);

    card.box = newBox;
    card.nextReview = nextReviewDate;
    card.lastResult = isCorrect ? "right" : "wrong";
    card.timesSeen = (card.timesSeen ?? 0) + 1;

    return {
      questionId: full.questionId,
      topic: full.topic,
      question: full.question,
      chosen,
      correct: full.correct,
      correctText: full.options[full.correct],
      isCorrect,
      explanation: full.explanation,
      previousBox,
      newBox,
      nextReviewDays: schedule.days,
      nextReviewDate,
      nextReviewLabel: schedule.label,
    };
  });

  const nextQuizzes = [...session.quizzes];
  if (nextQuizzes.length > 0) {
    nextQuizzes[nextQuizzes.length - 1] = {
      ...nextQuizzes[nextQuizzes.length - 1],
      status: "completed",
      score,
    };
  }

  const nextSession: OfflineSessionData = {
    simDate: session.simDate,
    cards: updatedCards,
    quizzes: nextQuizzes,
  };

  return {
    grade: {
      ok: true,
      simDate: session.simDate,
      score,
      total: quiz.questions.length,
      results,
    },
    nextSession,
    state: buildOfflineState(nextSession),
  };
}

export function advanceOfflineSession(
  session: OfflineSessionData,
  daysForward: DaysForward
): {
  simDate: string;
  quiz: MozakraLiveQuiz | null;
  message?: string;
  nextSession: OfflineSessionData;
  state: MozakraStateSuccess;
} {
  const nextDate = addDays(session.simDate, daysForward);
  const due = session.cards
    .filter((c) => !c.nextReview || c.nextReview <= nextDate)
    .sort((a, b) => {
      const aWrong = a.lastResult === "wrong" ? 0 : 1;
      const bWrong = b.lastResult === "wrong" ? 0 : 1;
      if (aWrong !== bWrong) return aWrong - bWrong;
      if (a.box !== b.box) return a.box - b.box;
      return (a.nextReview ?? "").localeCompare(b.nextReview ?? "");
    })
    .slice(0, 5);

  const nextSession: OfflineSessionData = {
    simDate: nextDate,
    cards: session.cards.map((c) => ({ ...c })),
    quizzes: [...session.quizzes],
  };

  if (due.length === 0) {
    const earliest = session.cards
      .map((c) => c.nextReview)
      .filter((d): d is string => Boolean(d))
      .sort()[0];
    return {
      simDate: nextDate,
      quiz: null,
      message: earliest
        ? `No cards are due on ${nextDate}. Next review is scheduled for ${earliest}.`
        : `No cards are due on ${nextDate}. Try skipping further ahead.`,
      nextSession,
      state: buildOfflineState(nextSession),
    };
  }

  const questions = due
    .map((c) => OFFLINE_QUESTIONS.find((q) => q.questionId === c.questionId))
    .filter((q): q is OfflineQuestionInternal => Boolean(q))
    .map(toPublicQuestion);

  const quiz: MozakraLiveQuiz = {
    token: `00000000000000000000000000${String(nextSession.quizzes.length + 1).padStart(6, "0")}`,
    total: questions.length,
    questions,
  };

  nextSession.quizzes.push({
    date: nextDate,
    status: "sent",
    score: null,
    total: quiz.total,
  });

  return {
    simDate: nextDate,
    quiz,
    nextSession,
    state: buildOfflineState(nextSession),
  };
}

