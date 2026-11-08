"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, FileText, Plus, RotateCcw, RotateCw, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/hr/client";
import { ChatResponseSchema, CompaniesResponseSchema, type ChatMessage, type Company } from "@/lib/hr/schemas";
import { cn } from "@/lib/utils";
import { AddPoliciesDialog } from "./add-policies-dialog";

const MAX_CHARS = 1000;
const DEFAULT_COMPANY = "Demo Co";
const FAQ = [
  "How many annual leave days do I get?",
  "Can I work remotely?",
  "How do I claim expenses?",
  "What are the working hours?",
  "How long is probation?",
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  followUps?: string[];
  found?: boolean;
  /** Set on a user message whose request failed. */
  error?: string;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export function Chat() {
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [companiesError, setCompaniesError] = useState(false);
  const [company, setCompany] = useState(DEFAULT_COMPANY);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadCompanies = useCallback(async (select?: string) => {
    setCompaniesError(false);
    const res = await api("/api/hr/companies", CompaniesResponseSchema);
    if (!res.ok) {
      setCompaniesError(true);
      setCompanies((prev) => prev ?? [{ name: DEFAULT_COMPANY, policy_count: 0 }]);
      return;
    }
    setCompanies(res.data.companies);
    if (select) setCompany(select);
    else if (!res.data.companies.some((c) => c.name === DEFAULT_COMPANY) && res.data.companies[0]) {
      setCompany(res.data.companies[0].name);
    }
  }, []);

  useEffect(() => {
    // Initial fetch of the company list on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function ask(text: string, prior: Message[]) {
    const question = text.trim().slice(0, MAX_CHARS);
    if (!question || loading) return;

    const userMsg: Message = { id: uid(), role: "user", content: question };
    const history: ChatMessage[] = prior
      .filter((m) => !m.error)
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages([...prior, userMsg]);
    setLoading(true);

    const res = await api("/api/hr/chat", ChatResponseSchema, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: question, company, history }),
    });
    setLoading(false);

    if (!res.ok) {
      setMessages((m) => m.map((x) => (x.id === userMsg.id ? { ...x, error: res.error } : x)));
      return;
    }
    setMessages((m) => [
      ...m,
      {
        id: uid(),
        role: "assistant",
        content: res.data.answer,
        sources: res.data.sources,
        followUps: res.data.follow_ups,
        found: res.data.found,
      },
    ]);
  }

  function send(text: string) {
    void ask(text, messages);
    setInput("");
    inputRef.current?.focus();
  }

  function retry(msg: Message) {
    const idx = messages.findIndex((m) => m.id === msg.id);
    void ask(msg.content, messages.slice(0, idx));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  }

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;
  const remaining = MAX_CHARS - input.length;

  return (
    <div className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <label htmlFor="company" className="text-sm text-muted">
          Company
        </label>
        {companies ? (
          <select
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="h-9 rounded-[var(--radius-btn)] border border-border bg-surface px-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {companies.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
                {c.policy_count ? ` (${c.policy_count} policies)` : ""}
              </option>
            ))}
          </select>
        ) : (
          <Skeleton className="h-9 w-44" />
        )}
        {companiesError && (
          <button onClick={() => loadCompanies()} className="text-xs text-danger-text underline">
            Couldn&apos;t load companies. Retry
          </button>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" aria-hidden /> Add company policies
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMessages([])} disabled={messages.length === 0 || loading}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> New chat
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="h-[min(60vh,560px)] min-h-[360px] overflow-y-auto px-4 py-6 sm:px-6"
        role="log"
        aria-live="polite"
        aria-label="Conversation"
      >
        {messages.length === 0 ? (
          <div className="mx-auto flex h-full max-w-lg flex-col justify-center">
            <p className="font-heading text-2xl">Ask anything about {company}&apos;s policies.</p>
            <p className="mt-2 text-sm text-muted">Answers come only from the company&apos;s policy documents, and name their source.</p>
            <p className="label-caps mt-8">Frequently asked</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {FAQ.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-[var(--radius-btn)] border border-border bg-surface px-3 py-2 text-left text-sm transition-colors hover:border-accent/50 hover:bg-surface-2"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ol className="space-y-5">
            {messages.map((m) => (
              <li key={m.id}>
                {m.role === "user" ? (
                  <div className="flex flex-col items-end">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm text-accent-contrast">
                      <span className="sr-only">You: </span>
                      {m.content}
                    </div>
                    {m.error && (
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-danger-text" role="alert">
                        <span>{m.error}</span>
                        <button onClick={() => retry(m)} disabled={loading} className="inline-flex items-center gap-1 font-medium underline disabled:opacity-50">
                          <RotateCw className="h-3 w-3" aria-hidden /> Retry
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <AssistantMessage message={m} showFollowUps={m.id === lastAssistantId && !loading} onAsk={send} />
                )}
              </li>
            ))}
            {loading && (
              <li aria-label="HR assistant is typing">
                <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-surface-2 px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-muted animate-blink" style={{ animationDelay: `${i * 0.18}s` }} />
                  ))}
                </div>
              </li>
            )}
          </ol>
        )}
      </div>

      {/* Composer */}
      <form
        className="border-t border-border p-3 sm:p-4"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <div className="flex items-end gap-2 rounded-[var(--radius-btn)] border border-border bg-bg/40 p-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
          <label htmlFor="chat-input" className="sr-only">
            Your question
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={MAX_CHARS}
            placeholder="Ask about leave, remote work, expenses…"
            className="field-sizing-content max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm placeholder:text-muted/80 focus:outline-none"
            aria-describedby="chat-hint"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || loading} aria-label="Send message">
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
        <div id="chat-hint" className="mt-1.5 flex justify-between px-1 text-xs text-muted">
          <span>Enter to send · Shift+Enter for a new line</span>
          <span className={cn(remaining < 100 && "text-warning-text")} aria-live="polite">
            {remaining < 200 ? `${remaining} characters left` : ""}
          </span>
        </div>
      </form>

      <AddPoliciesDialog open={dialogOpen} onOpenChange={setDialogOpen} onAdded={(name) => void loadCompanies(name)} />
    </div>
  );
}

function AssistantMessage({
  message,
  showFollowUps,
  onAsk,
}: {
  message: Message;
  showFollowUps: boolean;
  onAsk: (q: string) => void;
}) {
  return (
    <div className="flex max-w-[90%] flex-col items-start">
      <div className="whitespace-pre-wrap rounded-2xl rounded-bl-md border border-border bg-surface-2/60 px-4 py-3 text-sm leading-relaxed">
        <span className="sr-only">HR assistant: </span>
        {message.content}
      </div>
      {message.found === false && (
        <span className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted">
          <SearchX className="h-3 w-3" aria-hidden /> Not found in policies
        </span>
      )}
      {message.sources && message.sources.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted">Sources:</span>
          {message.sources.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-xs">
              <FileText className="h-3 w-3 text-accent" aria-hidden /> {s}
            </span>
          ))}
        </div>
      )}
      {showFollowUps && message.followUps && message.followUps.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Suggested follow-up questions">
          {message.followUps.map((q) => (
            <button
              key={q}
              onClick={() => onAsk(q)}
              className="rounded-[var(--radius-btn)] border border-accent/30 px-2.5 py-1 text-xs text-accent transition-colors hover:bg-accent/10"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

