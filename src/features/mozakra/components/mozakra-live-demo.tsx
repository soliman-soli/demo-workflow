"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  ChevronDown,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { ErrorState, Notice } from "@/components/ui/states";
import {
  MOZAKRA_MAX_PDF_BYTES,
  MOZAKRA_MAX_TEXT_CHARS,
  MOZAKRA_MIN_TEXT_CHARS,
  MozakraGradeResponseSchema,
  MozakraNextResponseSchema,
  MozakraStartClientResponseSchema,
  MozakraStateResponseSchema,
  type DaysForward,
  type MozakraDroppedItem,
  type MozakraGradeItemResult,
  type MozakraGradeSuccess,
  type MozakraLiveQuiz,
  type MozakraStateSuccess,
  type MozakraTerm,
  type OptionKey,
} from "@/lib/mozakra/schemas";
import {
  SAMPLE_LECTURE_TEXT,
  advanceOfflineSession,
  createOfflineStart,
  gradeOfflineSession,
  type OfflineSessionData,
} from "@/lib/mozakra/offline-sample";
import { cn } from "@/lib/utils";

type DemoPhase = "input" | "generating" | "quiz" | "result";
type BoxNumber = 1 | 2 | 3 | 4;

const OPTION_KEYS: readonly OptionKey[] = ["A", "B", "C", "D"] as const;
const SKIP_OPTIONS: readonly DaysForward[] = [1, 3, 7, 14] as const;

const BOX_COLUMNS: readonly {
  box: BoxNumber;
  label: string;
  interval: string;
  tone: Tone;
}[] = [
  { box: 1, label: "Box 1", interval: "Daily", tone: "danger" },
  { box: 2, label: "Box 2", interval: "3 days", tone: "warning" },
  { box: 3, label: "Box 3", interval: "7 days", tone: "info" },
  { box: 4, label: "Box 4", interval: "14 days", tone: "success" },
] as const;

interface BehindTheScenes {
  lectureId: string;
  summary: string;
  terms: MozakraTerm[];
  dropped: MozakraDroppedItem[];
  validCount: number;
}

export function MozakraLiveDemo() {
  const [phase, setPhase] = useState<DemoPhase>("input");
  const [isOfflineSample, setIsOfflineSample] = useState(false);
  const [offlineSession, setOfflineSession] =
    useState<OfflineSessionData | null>(null);

  // Input state
  const [lectureText, setLectureText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [backendOffline, setBackendOffline] = useState(false);

  // Active session & quiz state
  const [meta, setMeta] = useState<BehindTheScenes | null>(null);
  const [simDate, setSimDate] = useState<string>("");
  const [quiz, setQuiz] = useState<MozakraLiveQuiz | null>(null);
  const [resumedNotice, setResumedNotice] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionKey>>({});

  // Grade, Leitner board & time travel state
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [gradeResult, setGradeResult] = useState<MozakraGradeSuccess | null>(
    null
  );
  const [boardState, setBoardState] = useState<MozakraStateSuccess | null>(null);
  const [movedOutcomes, setMovedOutcomes] = useState<
    Record<string, "right" | "wrong">
  >({});
  const [skipping, setSkipping] = useState<DaysForward | null>(null);
  const [skipMessage, setSkipMessage] = useState<string | null>(null);
  const [skipError, setSkipError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSelectPdf(file: File | null) {
    setInputError(null);
    if (!file) {
      setPdfFile(null);
      return;
    }
    if (file.type !== "application/pdf") {
      setInputError("Only PDF files (application/pdf) are accepted.");
      return;
    }
    if (file.size === 0) {
      setInputError("The selected PDF file is empty.");
      return;
    }
    if (file.size > MOZAKRA_MAX_PDF_BYTES) {
      setInputError("PDF file must be 5 MB or smaller.");
      return;
    }
    setPdfFile(file);
  }

  async function fetchLiveState() {
    try {
      const res = await fetch("/api/mozakra/state", {
        method: "POST",
        cache: "no-store",
      });
      const json: unknown = await res.json().catch(() => null);
      const parsed = MozakraStateResponseSchema.safeParse(json);
      if (parsed.success && parsed.data.ok) {
        setBoardState(parsed.data);
        setSimDate(parsed.data.simDate);
      }
    } catch {
      /* keep current board state if refresh fails transiently */
    }
  }

  function loadOfflineSample() {
    const init = createOfflineStart();
    setIsOfflineSample(true);
    setOfflineSession(init.session);
    setBackendOffline(false);
    setInputError(null);
    setGradeError(null);
    setSkipError(null);
    setSkipMessage(null);
    setResumedNotice(false);
    setMeta({
      lectureId: init.start.lectureId,
      summary: init.start.summary,
      terms: init.start.terms,
      dropped: init.start.dropped,
      validCount: init.start.validCount,
    });
    setSimDate(init.start.simDate);
    setQuiz(init.start.quiz);
    setBoardState(init.state);
    setAnswers({});
    setGradeResult(null);
    setMovedOutcomes({});
    setStep(0);
    setPhase("quiz");
  }

  async function handleStart() {
    if (phase === "generating") return;
    setInputError(null);
    setBackendOffline(false);

    if (!pdfFile) {
      const len = lectureText.trim().length;
      if (len < MOZAKRA_MIN_TEXT_CHARS) {
        setInputError(
          `Paste at least ${MOZAKRA_MIN_TEXT_CHARS} characters of lecture text (currently ${len}), or upload a PDF.`
        );
        return;
      }
      if (len > MOZAKRA_MAX_TEXT_CHARS) {
        setInputError(
          `Lecture text must be ${MOZAKRA_MAX_TEXT_CHARS.toLocaleString()} characters or fewer.`
        );
        return;
      }
    }

    setPhase("generating");
    setIsOfflineSample(false);
    setOfflineSession(null);

    let res: Response;
    try {
      if (pdfFile) {
        const fd = new FormData();
        fd.append("file", pdfFile, pdfFile.name);
        res = await fetch("/api/mozakra/start", {
          method: "POST",
          body: fd,
          cache: "no-store",
        });
      } else {
        res = await fetch("/api/mozakra/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: lectureText.trim() }),
          cache: "no-store",
        });
      }
    } catch {
      setPhase("input");
      setBackendOffline(true);
      setInputError("The live demo backend is offline right now.");
      return;
    }

    const json: unknown = await res.json().catch(() => null);
    const parsed = MozakraStartClientResponseSchema.safeParse(json);
    if (!parsed.success) {
      setPhase("input");
      setBackendOffline(res.status >= 502 || res.status === 0);
      setInputError(
        res.status === 429
          ? "Rate limit reached (5 starts per 10 minutes). Try the offline sample below."
          : "The live demo backend is offline right now."
      );
      return;
    }

    if (!parsed.data.ok) {
      setPhase("input");
      if (res.status >= 502 || res.status === 429) setBackendOffline(true);
      setInputError(parsed.data.error);
      return;
    }

    const startData = parsed.data;
    setMeta({
      lectureId: startData.lectureId,
      summary: startData.summary,
      terms: startData.terms,
      dropped: startData.dropped,
      validCount: startData.validCount,
    });
    setSimDate(startData.simDate);
    setQuiz(startData.quiz);
    setResumedNotice(false);
    setAnswers({});
    setGradeResult(null);
    setGradeError(null);
    setSkipMessage(null);
    setSkipError(null);
    setMovedOutcomes({});
    setStep(0);
    setPhase("quiz");

    void fetchLiveState();
  }

  async function handleGrade() {
    if (!quiz || grading) return;
    setGradeError(null);
    setSkipMessage(null);
    setSkipError(null);

    if (isOfflineSample && offlineSession) {
      const outcome = gradeOfflineSession(offlineSession, quiz, answers);
      setOfflineSession(outcome.nextSession);
      setBoardState(outcome.state);
      setSimDate(outcome.grade.simDate);
      const moved: Record<string, "right" | "wrong"> = {};
      for (const r of outcome.grade.results) {
        moved[r.questionId] = r.isCorrect ? "right" : "wrong";
      }
      setMovedOutcomes(moved);
      setGradeResult(outcome.grade);
      setPhase("result");
      return;
    }

    setGrading(true);
    let res: Response;
    try {
      res = await fetch("/api/mozakra/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: quiz.token, answers }),
        cache: "no-store",
      });
    } catch {
      setGrading(false);
      setGradeError("The live demo backend is offline right now.");
      return;
    }

    setGrading(false);
    const json: unknown = await res.json().catch(() => null);
    const parsed = MozakraGradeResponseSchema.safeParse(json);

    if (!parsed.success || !parsed.data.ok) {
      setGradeError(
        parsed.success && !parsed.data.ok
          ? parsed.data.error
          : "The live demo backend is offline right now."
      );
      return;
    }

    const graded = parsed.data;
    const moved: Record<string, "right" | "wrong"> = {};
    for (const r of graded.results) {
      moved[r.questionId] = r.isCorrect ? "right" : "wrong";
    }
    setMovedOutcomes(moved);
    setSimDate(graded.simDate);
    setGradeResult(graded);
    setPhase("result");

    await fetchLiveState();
  }

  async function handleSkipDays(daysForward: DaysForward) {
    if (skipping !== null) return;
    setSkipMessage(null);
    setSkipError(null);
    setResumedNotice(false);

    if (isOfflineSample && offlineSession) {
      const next = advanceOfflineSession(offlineSession, daysForward);
      setOfflineSession(next.nextSession);
      setBoardState(next.state);
      setSimDate(next.simDate);
      if (!next.quiz) {
        setSkipMessage(
          next.message ?? "No cards are due yet. Try skipping further ahead."
        );
        return;
      }
      setQuiz(next.quiz);
      setAnswers({});
      setGradeResult(null);
      setStep(0);
      setPhase("quiz");
      return;
    }

    setSkipping(daysForward);
    let res: Response;
    try {
      res = await fetch("/api/mozakra/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysForward }),
        cache: "no-store",
      });
    } catch {
      setSkipping(null);
      setSkipError("The live demo backend is offline right now.");
      return;
    }

    setSkipping(null);
    const json: unknown = await res.json().catch(() => null);
    const parsed = MozakraNextResponseSchema.safeParse(json);

    if (!parsed.success || !parsed.data.ok) {
      setSkipError(
        parsed.success && !parsed.data.ok
          ? parsed.data.error
          : "The live demo backend is offline right now."
      );
      return;
    }

    if ("none" in parsed.data && parsed.data.none === true) {
      if (parsed.data.simDate) setSimDate(parsed.data.simDate);
      setSkipMessage(parsed.data.message);
      void fetchLiveState();
      return;
    }

    if ("quiz" in parsed.data) {
      setSimDate(parsed.data.simDate);
      setQuiz(parsed.data.quiz);
      setResumedNotice(Boolean(parsed.data.resumed));
      setAnswers({});
      setGradeResult(null);
      setGradeError(null);
      setStep(0);
      setPhase("quiz");
      void fetchLiveState();
    }
  }

  function handleNewLecture() {
    setPhase("input");
    setIsOfflineSample(false);
    setOfflineSession(null);
    setMeta(null);
    setQuiz(null);
    setBoardState(null);
    setAnswers({});
    setGradeResult(null);
    setGradeError(null);
    setSkipMessage(null);
    setSkipError(null);
    setMovedOutcomes({});
    setResumedNotice(false);
    setStep(0);
  }

  const trimmedLength = lectureText.trim().length;
  const canStart =
    phase !== "generating" &&
    (Boolean(pdfFile) ||
      (trimmedLength >= MOZAKRA_MIN_TEXT_CHARS &&
        trimmedLength <= MOZAKRA_MAX_TEXT_CHARS));

  const currentQuestion = quiz ? quiz.questions[step] : null;
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz?.questions.length ?? 0;

  return (
    <div className="space-y-8">
      {isOfflineSample && meta && (
        <Notice tone="info">
          <strong>Offline sample mode:</strong> running locally on 5 hardcoded
          hash-table questions with the same Leitner rules because the live n8n
          backend is offline.
        </Notice>
      )}

      {/* INPUT STATE */}
      {phase === "input" && (
        <div className="space-y-5 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-medium text-text">
                1. Provide a lecture
              </h3>
              <p className="mt-0.5 text-xs text-muted">
                Paste 200–30,000 characters of lecture notes or drop a PDF (max
                5 MB).
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setPdfFile(null);
                setInputError(null);
                setLectureText(SAMPLE_LECTURE_TEXT);
              }}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Try a sample lecture
            </Button>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="mozakra-lecture-text"
                className="text-sm font-medium text-text"
              >
                Lecture text
              </label>
              <span
                className={cn(
                  "font-mono text-xs tabular-nums",
                  trimmedLength > 0 && trimmedLength < MOZAKRA_MIN_TEXT_CHARS
                    ? "text-warning-text"
                    : "text-muted"
                )}
              >
                {trimmedLength.toLocaleString()} /{" "}
                {MOZAKRA_MAX_TEXT_CHARS.toLocaleString()} chars
              </span>
            </div>
            <textarea
              id="mozakra-lecture-text"
              value={lectureText}
              onChange={(e) => {
                setInputError(null);
                setLectureText(e.target.value);
              }}
              disabled={Boolean(pdfFile)}
              rows={7}
              placeholder="Paste lecture notes here, or click 'Try a sample lecture' above…"
              className="w-full resize-y rounded-[var(--radius-btn)] border border-border bg-bg/50 px-3.5 py-2.5 text-sm text-text placeholder:text-muted/80 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
            />
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-text">
              Or upload a lecture PDF{" "}
              <span className="font-normal text-muted">(max 5 MB)</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => {
                handleSelectPdf(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
              className="hidden"
              aria-label="Upload lecture PDF"
            />

            {pdfFile ? (
              <div className="flex items-center justify-between gap-3 rounded-[var(--radius-btn)] border border-accent/40 bg-accent/8 px-4 py-3 text-sm">
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <span className="truncate font-medium text-text">
                    {pdfFile.name}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted">
                    {(pdfFile.size / 1024).toFixed(0)} KB
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelectPdf(null)}
                  aria-label="Remove PDF"
                >
                  <X className="h-4 w-4" aria-hidden />
                  Remove
                </Button>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  handleSelectPdf(e.dataTransfer.files?.[0] ?? null);
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[var(--radius-btn)] border border-dashed px-4 py-6 text-center text-sm transition-colors",
                  dragging
                    ? "border-accent bg-accent/10 text-text"
                    : "border-border bg-bg/30 text-muted hover:border-accent/50 hover:text-text"
                )}
              >
                <Upload className="h-5 w-5 text-accent" aria-hidden />
                <span>
                  Drag and drop a PDF here, or{" "}
                  <span className="font-medium text-accent underline">
                    browse files
                  </span>
                </span>
                <span className="text-xs text-muted">
                  application/pdf · max 5 MB
                </span>
              </div>
            )}
          </div>

          {inputError && (
            <div className="space-y-3">
              <ErrorState message={inputError} />
              {backendOffline && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-btn)] border border-border bg-surface-2/60 px-4 py-3 text-sm">
                  <span className="text-muted">
                    Explore the full quiz, Leitner board, and time-skipping flow
                    locally:
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadOfflineSample}
                  >
                    Try offline sample
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={loadOfflineSample}
              className="text-xs text-muted underline underline-offset-4 hover:text-text"
            >
              Or try the Offline sample
            </button>
            <Button
              type="button"
              disabled={!canStart}
              onClick={() => void handleStart()}
            >
              Generate quiz
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}

      {/* GENERATING STATE */}
      {phase === "generating" && (
        <div
          role="status"
          aria-live="polite"
          className="space-y-5 rounded-[var(--radius-card)] border border-border bg-surface p-6"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-accent" aria-hidden />
            <div>
              <p className="font-medium text-text">
                Gemini is reading your lecture… ~15 to 30 s
              </p>
              <p className="text-xs text-muted">
                Writing study notes, validating questions in code, and seeding
                your sandbox session in Google Sheets.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SkeletonCard />
            <div className="space-y-3 rounded-[var(--radius-card)] border border-border p-5">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE SESSION: BEHIND THE SCENES + QUIZ/RESULT + LEITNER BOARD + TIME TRAVEL */}
      {meta && (phase === "quiz" || phase === "result") && (
        <div className="space-y-6">
          {/* Behind the scenes */}
          <div className="space-y-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="label-caps">Behind the scenes</p>
                  <Badge tone={isOfflineSample ? "info" : "success"}>
                    {isOfflineSample ? "Offline sample" : "Live · Google Sheets"}
                  </Badge>
                  {simDate && (
                    <Badge tone="neutral" className="font-mono">
                      Sim date: {simDate}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5" aria-label="Rows written by pipeline">
                  <Badge tone="accent">Lectures +1</Badge>
                  <Badge tone="accent">Questions +{meta.validCount}</Badge>
                  <Badge tone="accent">Cards +{meta.validCount}</Badge>
                  <Badge tone="accent">Quizzes +1</Badge>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNewLecture}
              >
                New lecture
              </Button>
            </div>

            <p className="text-sm leading-relaxed text-text">{meta.summary}</p>

            {meta.terms.length > 0 && (
              <dl className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                {meta.terms.map((t) => (
                  <div
                    key={t.term}
                    className="rounded-[var(--radius-btn)] border border-border/80 bg-bg/40 p-3"
                  >
                    <dt className="text-xs font-semibold text-accent">
                      {t.term}
                    </dt>
                    <dd className="mt-1 text-xs leading-relaxed text-muted">
                      {t.definition}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {/* Code Checker panel */}
            <details className="group rounded-[var(--radius-btn)] border border-border bg-bg/40 px-4 py-3 text-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-medium text-text">
                <span>
                  {meta.dropped.length}{" "}
                  {meta.dropped.length === 1
                    ? "AI question was rejected by the code checker"
                    : "AI questions were rejected by the code checker"}
                </span>
                <ChevronDown
                  className="h-4 w-4 text-muted transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              {meta.dropped.length === 0 ? (
                <p className="mt-2 text-xs text-muted">
                  All generated questions passed the deterministic code checks
                  on this run.
                </p>
              ) : (
                <ul className="mt-3 space-y-1.5 border-t border-border pt-3 text-xs text-muted">
                  {meta.dropped.map((d, i) => (
                    <li
                      key={`${d.n}-${i}`}
                      className="flex items-start gap-2 font-mono"
                    >
                      <span className="shrink-0 text-warning-text">
                        #{d.n}
                      </span>
                      <span className="font-sans text-text/90">{d.why}</span>
                    </li>
                  ))}
                </ul>
              )}
            </details>
          </div>

          {/* QUIZ STATE */}
          {phase === "quiz" && quiz && currentQuestion && (
            <div className="space-y-5 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
              {resumedNotice && (
                <Notice tone="info">
                  Resuming your previous unanswered quiz before advancing time.
                </Notice>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="label-caps">
                    Question {step + 1} of {totalQuestions}
                  </span>
                  <Badge tone="neutral">{currentQuestion.topic}</Badge>
                </div>
                <span className="font-mono text-xs text-muted tabular-nums">
                  {answeredCount}/{totalQuestions} answered
                </span>
              </div>

              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
                role="progressbar"
                aria-valuenow={step + 1}
                aria-valuemin={1}
                aria-valuemax={totalQuestions}
                aria-label="Quiz progress"
              >
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-200"
                  style={{ width: `${((step + 1) / totalQuestions) * 100}%` }}
                />
              </div>

              <fieldset className="space-y-3">
                <legend className="text-base font-medium leading-snug text-text sm:text-lg">
                  {currentQuestion.question}
                </legend>

                <div className="space-y-2 pt-1">
                  {OPTION_KEYS.map((key) => {
                    const id = `${currentQuestion.questionId}-${key}`;
                    const checked = answers[currentQuestion.questionId] === key;
                    return (
                      <label
                        key={key}
                        htmlFor={id}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-[var(--radius-btn)] border px-3.5 py-3 text-sm transition-colors",
                          checked
                            ? "border-accent bg-accent/10 text-text"
                            : "border-border bg-bg/40 text-muted hover:border-accent/40 hover:text-text"
                        )}
                      >
                        <input
                          id={id}
                          type="radio"
                          name={currentQuestion.questionId}
                          value={key}
                          checked={checked}
                          onChange={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [currentQuestion.questionId]: key,
                            }))
                          }
                          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
                        />
                        <span className="flex-1 leading-relaxed">
                          <strong className="mr-1.5 font-mono text-xs font-semibold text-accent">
                            {key}.
                          </strong>
                          {currentQuestion.options[key]}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {gradeError && (
                <ErrorState
                  message={gradeError}
                  onRetry={() => void handleGrade()}
                />
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={step === 0 || grading}
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                  Previous
                </Button>

                {step < totalQuestions - 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={!answers[currentQuestion.questionId]}
                    onClick={() =>
                      setStep((s) => Math.min(totalQuestions - 1, s + 1))
                    }
                  >
                    Next question
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    disabled={answeredCount < totalQuestions || grading}
                    onClick={() => void handleGrade()}
                  >
                    {grading && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    )}
                    Submit &amp; grade
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* RESULT STATE */}
          {phase === "result" && gradeResult && (
            <div
              aria-live="polite"
              className="space-y-5 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <p className="label-caps">
                    Graded result · {gradeResult.simDate}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <h3 className="text-2xl font-medium text-text tabular-nums">
                      Score: {gradeResult.score} / {gradeResult.total}
                    </h3>
                    <Badge
                      tone={
                        gradeResult.score / gradeResult.total >= 0.8
                          ? "success"
                          : gradeResult.score / gradeResult.total >= 0.5
                            ? "warning"
                            : "danger"
                      }
                    >
                      {Math.round(
                        (gradeResult.score / gradeResult.total) * 100
                      )}
                      %
                    </Badge>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleNewLecture}
                >
                  New lecture
                </Button>
              </div>

              <ol className="space-y-3.5">
                {gradeResult.results.map(
                  (item: MozakraGradeItemResult, idx) => (
                    <li
                      key={item.questionId}
                      className="rounded-[var(--radius-btn)] border border-border bg-bg/50 p-4"
                    >
                      <p className="text-sm font-medium text-text">
                        <span
                          className="mr-1.5"
                          aria-label={item.isCorrect ? "Correct" : "Incorrect"}
                        >
                          {item.isCorrect ? "✅" : "❌"}
                        </span>
                        {idx + 1}. {item.question || item.questionId}
                      </p>

                      <div className="mt-2 space-y-1 text-xs text-muted">
                        {!item.isCorrect && item.chosen && (
                          <p>
                            Your answer:{" "}
                            <span className="text-danger-text">
                              {item.chosen}
                            </span>
                          </p>
                        )}
                        <p>
                          Correct answer:{" "}
                          <span className="font-medium text-success-text">
                            {item.correct}
                            {item.correctText ? `. ${item.correctText}` : ""}
                          </span>
                        </p>
                        <p className="pt-1 leading-relaxed text-text/90">
                          {item.explanation}
                        </p>
                        <p className="pt-1 font-mono text-[11px] text-accent">
                          Box {item.previousBox} → Box {item.newBox} · Comes
                          back: {item.nextReviewLabel}
                          {item.nextReviewDate ? ` (${item.nextReviewDate})` : ""}
                        </p>
                      </div>
                    </li>
                  )
                )}
              </ol>

              {/* Time travel controls */}
              <div className="space-y-3 rounded-[var(--radius-btn)] border border-border bg-bg/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CalendarClock
                      className="h-4 w-4 text-accent"
                      aria-hidden
                    />
                    <span className="text-sm font-medium text-text">
                      Simulate time passing
                    </span>
                  </div>
                  {simDate && (
                    <span className="font-mono text-xs text-muted">
                      Simulated date: {simDate}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {SKIP_OPTIONS.map((days) => (
                    <Button
                      key={days}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={skipping !== null}
                      onClick={() => void handleSkipDays(days)}
                    >
                      {skipping === days && (
                        <Loader2
                          className="h-3.5 w-3.5 animate-spin"
                          aria-hidden
                        />
                      )}
                      Skip {days} {days === 1 ? "day" : "days"}
                    </Button>
                  ))}
                </div>

                {skipMessage && (
                  <p
                    role="status"
                    aria-live="polite"
                    className="text-xs text-warning-text"
                  >
                    {skipMessage}
                  </p>
                )}
                {skipError && <ErrorState message={skipError} />}
              </div>
            </div>
          )}

          {/* LEITNER BOARD (from /api/mozakra/state) */}
          {boardState && (
            <section aria-labelledby="leitner-board-title" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3
                    id="leitner-board-title"
                    className="text-xl font-medium text-text"
                  >
                    Leitner spaced-repetition board
                  </h3>
                  <p className="mt-0.5 text-xs text-muted">
                    Live card boxes for this session (wrong answers return to
                    Box 1; right answers climb toward Box 4).
                  </p>
                </div>
                {boardState.simDate && (
                  <Badge tone="neutral" className="font-mono">
                    {boardState.simDate}
                  </Badge>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {BOX_COLUMNS.map((col) => {
                  const colCards = boardState.cards.filter(
                    (c) => c.box === col.box
                  );
                  const count =
                    boardState.boxCounts[String(col.box)] ?? colCards.length;

                  return (
                    <div
                      key={col.box}
                      className="flex min-h-[210px] flex-col rounded-[var(--radius-card)] border border-border bg-surface p-3.5"
                    >
                      <div className="flex items-center justify-between border-b border-border pb-2.5">
                        <div>
                          <p className="text-sm font-semibold text-text">
                            {col.label}
                          </p>
                          <p className="text-xs text-muted">{col.interval}</p>
                        </div>
                        <Badge tone={col.tone} className="tabular-nums">
                          {count}
                        </Badge>
                      </div>

                      <div className="mt-3 flex flex-1 flex-col gap-2">
                        {colCards.length === 0 ? (
                          <div className="flex flex-1 items-center justify-center rounded-[var(--radius-btn)] border border-dashed border-border/70 px-2 py-6 text-center text-xs text-muted">
                            Empty
                          </div>
                        ) : (
                          colCards.map((card) => {
                            const outcome = movedOutcomes[card.questionId];
                            return (
                              <div
                                key={card.questionId}
                                className={cn(
                                  "animate-fade rounded-[var(--radius-btn)] border bg-bg/60 p-2.5 transition-[border-color,background-color] duration-200",
                                  outcome === "right"
                                    ? "border-success/55 bg-success/8"
                                    : outcome === "wrong"
                                      ? "border-danger/55 bg-danger/8"
                                      : "border-border"
                                )}
                              >
                                <p className="label-caps">{card.topic}</p>
                                <p className="mt-1 line-clamp-2 text-xs text-text">
                                  {card.question}
                                </p>
                                {card.nextReview && (
                                  <p className="mt-1.5 font-mono text-[11px] text-muted">
                                    Due: {card.nextReview}
                                  </p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Honest note under the demo */}
      <p className="text-xs text-muted">
        Demo sessions run in a sandbox spreadsheet and are separate from real
        students. Time is simulated with the skip buttons.
      </p>
    </div>
  );
}

