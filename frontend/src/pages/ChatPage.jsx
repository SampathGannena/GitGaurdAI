import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const SUGGESTION_LIBRARY = [
  {
    id: "summary",
    label: "Summarize this PR",
    description: "Get a 4-bullet executive summary of intent and risk.",
    icon: "🧭",
  },
  {
    id: "risks",
    label: "Top 5 risks",
    description: "Rank the highest-risk changes and why they matter.",
    icon: "⚠️",
  },
  {
    id: "tests",
    label: "Suggest missing tests",
    description: "Identify untested branches and recommend coverage.",
    icon: "🧪",
  },
  {
    id: "security",
    label: "Security pass",
    description: "Scan for injection, auth, and data-exposure issues.",
    icon: "🛡️",
  },
  {
    id: "perf",
    label: "Performance review",
    description: "Spot N+1 queries, hot paths, and unnecessary work.",
    icon: "⚡",
  },
  {
    id: "refactor",
    label: "Refactor opportunities",
    description: "Surface duplication and complexity hot spots.",
    icon: "🧹",
  },
];

function ShieldGlyph({ size = 18, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3l8 3v5c0 4.5-3.4 8.6-8 10-4.6-1.4-8-5.5-8-10V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function Avatar({ author }) {
  if (author === "GitGuard AI") {
    return (
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300/30 via-violet-400/20 to-rose-400/30 text-cyan-100 ring-1 ring-cyan-300/40">
        <ShieldGlyph size={16} />
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
      </div>
    );
  }
  const initials = String(author || "You")
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/10 font-mono text-xs font-semibold text-slate-100 ring-1 ring-white/10">
      {initials || "Y"}
    </div>
  );
}

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDay(value) {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function groupByDay(messages) {
  const groups = [];
  let current = null;
  messages.forEach((message) => {
    const day = formatDay(message.createdAt);
    if (!current || current.day !== day) {
      current = { day, items: [] };
      groups.push(current);
    }
    current.items.push(message);
  });
  return groups;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((idx) => (
        <motion.span
          key={idx}
          className="h-1.5 w-1.5 rounded-full bg-cyan-200/80"
          animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: idx * 0.15 }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ message, onFollowUp, onResolve, onDelete, onSubmitFollowUp, followUpId, followUpText, setFollowUpText, isPending }) {
  const isAI = message.author === "GitGuard AI";
  const isResolved = message.resolved;
  const alignment = isAI ? "items-start" : "items-end";
  const bubbleTone = isResolved
    ? "border-emerald-400/25 bg-emerald-500/5"
    : isAI
    ? "border-cyan-300/25 bg-gradient-to-br from-cyan-300/10 via-slate-900/40 to-violet-400/10"
    : "border-white/10 bg-white/[0.05]";

  return (
    <motion.li
      layout
      variants={itemVariants}
      className={`flex gap-3 ${alignment}`}
    >
      {isAI && <Avatar author="GitGuard AI" />}
      <div className={`flex max-w-2xl flex-col gap-2 ${isAI ? "" : "items-end"}`}>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-300">
            {isAI ? "GitGuard AI" : message.author || "You"}
          </span>
          {isAI && (
            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
              Repo-aware
            </span>
          )}
          {isResolved && (
            <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
              ✓ Resolved
            </span>
          )}
          <span>· {formatTime(message.createdAt)}</span>
        </div>

        <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 text-slate-100 ${bubbleTone}`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {message.replies && message.replies.length > 0 && (
          <div className="w-full max-w-2xl space-y-2 rounded-2xl border border-white/5 bg-black/20 p-3">
            {message.replies.map((reply, idx) => (
              <div key={idx} className="flex gap-2 text-xs">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-300">{reply.author || "Follow-up"}</p>
                  <p className="whitespace-pre-wrap text-slate-400">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => onFollowUp(message._id)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-slate-300 transition hover:bg-white/10"
          >
            ↳ Follow up
          </button>
          {!isAI && !isResolved && (
            <button
              type="button"
              onClick={() => onResolve(message._id)}
              className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
            >
              ✓ Mark handled
            </button>
          )}
          {!isAI && (
            <button
              type="button"
              onClick={() => onDelete(message._id)}
              className="rounded-full border border-white/10 bg-white/0 px-3 py-1 text-slate-500 transition hover:border-rose-400/30 hover:text-rose-200"
            >
              Delete
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {followUpId === message._id && (
            <motion.form
              key="followup"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={(event) => {
                event.preventDefault();
                onSubmitFollowUp(message._id);
              }}
              className="w-full max-w-2xl overflow-hidden"
            >
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-2">
                <input
                  type="text"
                  value={followUpText}
                  onChange={(event) => setFollowUpText(event.target.value)}
                  placeholder="Ask a sharper follow-up..."
                  className="flex-1 bg-transparent px-2 py-1 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!followUpText.trim() || isPending}
                  className="rounded-xl bg-cyan-300/20 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/30 disabled:opacity-50"
                >
                  Send
                </button>
                <button
                  type="button"
                  onClick={() => onFollowUp(null)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
      {!isAI && <Avatar author={message.author} />}
    </motion.li>
  );
}

function SuggestionCard({ suggestion, onApply, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onApply(suggestion)}
      disabled={disabled}
      className="group flex w-full items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-cyan-300/30 hover:bg-white/[0.06] disabled:opacity-50"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-lg">
        {suggestion.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-100 group-hover:text-white">
          {suggestion.label}
        </span>
        <span className="mt-0.5 block text-[11px] leading-5 text-slate-500">
          {suggestion.description}
        </span>
      </span>
      <span className="shrink-0 self-center text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-cyan-200">→</span>
    </button>
  );
}

function ContextSidebar({ owner, repo, prNumber, messageCount, resolvedCount, lastActivity, onClear }) {
  const stats = [
    { label: "Total", value: messageCount },
    { label: "Open", value: Math.max(0, messageCount - resolvedCount) },
    { label: "Resolved", value: resolvedCount },
  ];
  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-4 lg:flex">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200">Session context</p>
        <h2 className="mt-2 text-lg font-semibold text-white">PR #{prNumber || "—"}</h2>
        <p className="mt-1 break-all font-mono text-xs text-slate-400">
          {owner && repo ? `${owner}/${repo}` : "No repository"}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-black/20 p-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
              <p className="mt-1 text-lg font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
        {lastActivity && (
          <p className="mt-3 text-[11px] text-slate-500">
            Last activity · {new Date(lastActivity).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-violet-200">Pro tips</p>
        <ul className="mt-3 space-y-2 text-xs text-slate-400">
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
            <span>Press <kbd className="rounded border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-slate-200">Enter</kbd> to send, <kbd className="rounded border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-slate-200">Shift + Enter</kbd> for a new line.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" />
            <span>Click any suggestion to instantly turn it into a prompt.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
            <span>Resolved prompts stay in the thread for context.</span>
          </li>
        </ul>
      </div>

      <button
        type="button"
        onClick={onClear}
        className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-2 text-xs text-slate-400 transition hover:border-rose-400/30 hover:text-rose-200"
      >
        Switch PR context
      </button>
    </aside>
  );
}

export default function ChatPage({ apiBase, apiFetch, owner, repo }) {
  const [messages, setMessages] = useState([]);
  const [prNumber, setPRNumber] = useState("");
  const [activePR, setActivePR] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  const fetchMessages = async (prNum) => {
    if (!owner || !repo || !prNum) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`${apiBase}/chat/${owner}/${repo}/${prNum}`);
      if (!res.ok) throw new Error("Failed to load AI assistance history");
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMessages = (event) => {
    event?.preventDefault();
    if (!owner || !repo) {
      setError("Connect a repository before using AI Assistance.");
      return;
    }
    if (prNumber.trim()) {
      setActivePR(prNumber);
      fetchMessages(prNumber);
    }
  };

  const sendMessage = async (content) => {
    if (!content.trim() || !activePR) return;
    setPending(true);
    setError("");
    try {
      const res = await apiFetch(`${apiBase}/chat/${owner}/${repo}/${activePR}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to save AI prompt");
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        data.message,
        ...(data.assistantMessage ? [data.assistantMessage] : []),
      ]);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setPending(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const content = newMessage;
    setNewMessage("");
    await sendMessage(content);
  };

  const handleAddFollowUp = async (messageId) => {
    if (!replyText.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(
        `${apiBase}/chat/${owner}/${repo}/${activePR}/${messageId}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: replyText }),
        },
      );
      if (!res.ok) throw new Error("Failed to save follow-up");
      const data = await res.json();
      setMessages((prev) => prev.map((message) => (message._id === messageId ? data.message : message)));
      setReplyText("");
      setActiveMessageId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHandled = async (messageId) => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(
        `${apiBase}/chat/${owner}/${repo}/${activePR}/${messageId}/resolve`,
        { method: "PUT" },
      );
      if (!res.ok) throw new Error("Failed to mark handled");
      const data = await res.json();
      setMessages((prev) => prev.map((message) => (message._id === messageId ? data.message : message)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePrompt = async (messageId) => {
    if (!window.confirm("Delete this AI prompt?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`${apiBase}/chat/${messageId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete prompt");
      setMessages((prev) => prev.filter((message) => message._id !== messageId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const groups = useMemo(() => groupByDay(messages), [messages]);
  const resolvedCount = messages.filter((m) => m.resolved).length;
  const lastActivity = messages[messages.length - 1]?.createdAt;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 pb-6"
    >
      {/* ============== HERO ============== */}
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 p-6 shadow-2xl md:p-8"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-cyan-300">
              <ShieldGlyph size={14} className="text-cyan-300" />
              GitGuardAI · 
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              Ask the repo-aware assistant.
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              A second pair of eyes for{" "}
              <span className="font-mono text-slate-200">{owner && repo ? `${owner}/${repo}` : "your connected repository"}</span>.
              Pull reviews, follow up on risks, and turn signals into actions — all in one thread per PR.
            </p>
          </div>

          <form onSubmit={handleLoadMessages} className="flex w-full max-w-md items-end gap-2">
            <div className="flex-1">
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                PR context
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 focus-within:border-cyan-300/50 focus-within:ring-4 focus-within:ring-cyan-300/10">
                <span className="font-mono text-xs text-slate-500">#</span>
                <input
                  type="number"
                  placeholder="Enter PR number"
                  value={prNumber}
                  onChange={(event) => setPRNumber(event.target.value)}
                  className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !prNumber || !owner || !repo}
              className="btn-primary px-5 py-3"
            >
              {loading && activePR === prNumber ? "Loading" : "Open thread"}
            </button>
          </form>
        </div>
      </motion.section>

      {error && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
        >
          {error}
        </motion.div>
      )}

      {/* ============== WORKSPACE ============== */}
      <motion.section
        variants={itemVariants}
        className="flex flex-col gap-4 lg:flex-row"
      >
        <ContextSidebar
          owner={owner}
          repo={repo}
          prNumber={activePR}
          messageCount={messages.length}
          resolvedCount={resolvedCount}
          lastActivity={lastActivity}
          onClear={() => {
            setActivePR("");
            setMessages([]);
            setPRNumber("");
            setActiveMessageId(null);
            setReplyText("");
          }}
        />

        <div className="flex min-h-[640px] flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          {!activePR ? (
            <div className="flex flex-1 items-center justify-center px-8 text-center">
              <div className="max-w-lg">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-500/10 text-cyan-200">
                  <ShieldGlyph size={26} />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-white">Open a PR thread to begin</h2>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  Enter a PR number above to load the assistant history. The thread remembers the full conversation,
                  follow-ups, and resolutions for that PR.
                </p>
                <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {SUGGESTION_LIBRARY.slice(0, 4).map((s) => (
                    <SuggestionCard
                      key={s.id}
                      suggestion={s}
                      onApply={() => setPRNumber((val) => val || "")}
                      disabled
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-500/10 text-cyan-200">
                    <ShieldGlyph size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">Thread · PR #{activePR}</p>
                    <p className="text-[11px] text-slate-500">
                      {messages.length} prompt{messages.length === 1 ? "" : "s"} · {resolvedCount} resolved
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Context locked to {owner}/{repo}
                </div>
              </header>

              {/* Messages */}
              <div className="hidden-scroll flex-1 space-y-6 overflow-y-auto p-5">
                {loading && messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-cyan-300 border-r-transparent" />
                      <p className="text-sm text-slate-400">Loading AI assistance history…</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
                      💬
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-200">No prompts in this thread yet</p>
                    <p className="mt-1 max-w-sm text-xs leading-6 text-slate-500">
                      Try a starter prompt below or write your own. Follow-ups and resolutions stay attached to the thread.
                    </p>
                    <div className="mt-5 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
                      {SUGGESTION_LIBRARY.slice(0, 4).map((s) => (
                        <SuggestionCard
                          key={s.id}
                          suggestion={s}
                          onApply={() => setNewMessage(`${s.label} — `)}
                          disabled={pending}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  groups.map((group) => (
                    <div key={group.day} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                          {group.day}
                        </span>
                        <span className="h-px flex-1 bg-white/5" />
                        <span className="text-[10px] text-slate-500">{group.items.length} message{group.items.length === 1 ? "" : "s"}</span>
                      </div>
                      <ul className="space-y-4">
                        {group.items.map((message) => (
                          <MessageBubble
                            key={message._id || message.createdAt}
                            message={message}
                            onFollowUp={(id) => {
                              setActiveMessageId(id);
                              setReplyText("");
                            }}
                            onResolve={handleMarkHandled}
                            onDelete={handleDeletePrompt}
                            onSubmitFollowUp={handleAddFollowUp}
                            followUpId={activeMessageId}
                            followUpText={replyText}
                            setFollowUpText={setReplyText}
                            isPending={loading}
                          />
                        ))}
                      </ul>
                    </div>
                  ))
                )}

                {pending && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3"
                  >
                    <Avatar author="GitGuard AI" />
                    <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/5 px-4 py-3">
                      <TypingDots />
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="border-t border-white/10 bg-gradient-to-b from-slate-950/40 to-slate-950 p-4">
                <div className="hidden-scroll mb-2 flex gap-2 overflow-x-auto pb-1">
                  {SUGGESTION_LIBRARY.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setNewMessage((prev) => prev || `${s.label} — `)}
                      disabled={pending}
                      className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-200 disabled:opacity-50"
                    >
                      <span className="mr-1">{s.icon}</span>
                      {s.label}
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-end gap-2 rounded-2xl border border-white/10 bg-black/30 p-2 focus-within:border-cyan-300/40 focus-within:ring-4 focus-within:ring-cyan-300/10"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-500/10 text-cyan-200">
                    <ShieldGlyph size={16} />
                  </span>
                  <textarea
                    rows={1}
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleSendMessage(event);
                      }
                    }}
                    placeholder="Ask GitGuard AI about this PR..."
                    disabled={pending}
                    className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={pending || !newMessage.trim() || !owner || !repo}
                    className="rounded-xl bg-gradient-to-r from-cyan-300 to-violet-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:shadow-lg hover:shadow-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pending ? "Thinking…" : "Send"}
                  </button>
                </form>
                <p className="mt-2 text-[10px] text-slate-500">
                  <kbd className="rounded border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">Enter</kbd> to send · <kbd className="rounded border border-white/10 bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">Shift + Enter</kbd> for a new line
                </p>
              </div>
            </>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}
