import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };

const severityStyles = {
  critical: {
    label: "Critical",
    dot: "bg-rose-400",
    text: "text-rose-200",
    border: "border-rose-400/30",
    panel: "from-rose-500/15 via-rose-500/5 to-transparent",
    chip: "bg-rose-500/15 text-rose-100 border-rose-400/30",
    ring: "ring-rose-400/40",
  },
  high: {
    label: "High",
    dot: "bg-orange-400",
    text: "text-orange-200",
    border: "border-orange-400/30",
    panel: "from-orange-500/15 via-orange-500/5 to-transparent",
    chip: "bg-orange-500/15 text-orange-100 border-orange-400/30",
    ring: "ring-orange-400/40",
  },
  medium: {
    label: "Medium",
    dot: "bg-amber-400",
    text: "text-amber-200",
    border: "border-amber-400/30",
    panel: "from-amber-500/15 via-amber-500/5 to-transparent",
    chip: "bg-amber-500/15 text-amber-100 border-amber-400/30",
    ring: "ring-amber-400/40",
  },
  low: {
    label: "Low",
    dot: "bg-cyan-400",
    text: "text-cyan-200",
    border: "border-cyan-400/30",
    panel: "from-cyan-500/15 via-cyan-500/5 to-transparent",
    chip: "bg-cyan-500/15 text-cyan-100 border-cyan-400/30",
    ring: "ring-cyan-400/40",
  },
};

const categoryMeta = {
  security: { label: "Security", icon: "🛡️" },
  performance: { label: "Performance", icon: "⚡" },
  maintainability: { label: "Maintainability", icon: "🧹" },
  reliability: { label: "Reliability", icon: "🧩" },
  style: { label: "Style", icon: "🎨" },
  testing: { label: "Testing", icon: "🧪" },
  default: { label: "General", icon: "📌" },
};

function normalizeSeverity(value) {
  const severity = String(value || "low").toLowerCase();
  return severityStyles[severity] ? severity : "low";
}

function normalizeCategory(value) {
  const key = String(value || "").toLowerCase();
  return categoryMeta[key] ? key : "default";
}

function getFileName(path) {
  return String(path || "Unknown file").split(/[\\/]/).pop() || path || "Unknown file";
}

function getDirectory(path) {
  const parts = String(path || "").split(/[\\/]/);
  parts.pop();
  return parts.join("/") || "/";
}

function formatDate(value) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(value) {
  if (!value) return "—";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function fingerprintOf(finding) {
  if (finding.fingerprint) return finding.fingerprint;
  return [finding.title, finding.filePath, finding.category, finding.severity]
    .map((part) => String(part || "").toLowerCase().trim())
    .filter(Boolean)
    .join("::");
}

function classifyGroup(finding) {
  if (finding.occurrences >= 3) return "recurring";
  if (finding.occurrences === 2) return "reopened";
  return "fresh";
}

const groupMeta = {
  recurring: {
    label: "Recurring hotspots",
    description: "Findings that keep coming back across multiple reviews. Best candidates for systemic fixes.",
    accent: "rose",
  },
  reopened: {
    label: "Reopened",
    description: "Seen twice — worth a closer look before the third occurrence.",
    accent: "amber",
  },
  fresh: {
    label: "New findings",
    description: "First-time signals from the most recent reviews.",
    accent: "cyan",
  },
};

function TrendBar({ value, max }) {
  const percent = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-300 to-rose-300"
      />
    </div>
  );
}

function SeverityChip({ severity }) {
  const style = severityStyles[severity];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

function CategoryChip({ category }) {
  const meta = categoryMeta[normalizeCategory(category)];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-300">
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  );
}

function FindingRow({ finding, expanded, onToggle, isLast }) {
  const severity = severityStyles[normalizeSeverity(finding.severity)];
  const group = classifyGroup(finding);
  const timeline = (finding.timeline || []).slice().sort((a, b) => new Date(b.runAt) - new Date(a.runAt));

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="relative pl-10"
    >
      <span className={`absolute left-3 top-6 h-3 w-3 -translate-x-1/2 rounded-full ${severity.dot} ring-4 ring-slate-950`} />
      {!isLast && <span className="absolute left-3 top-9 h-[calc(100%-1.5rem)] w-px -translate-x-1/2 bg-gradient-to-b from-white/15 to-white/0" />}

      <button
        type="button"
        onClick={onToggle}
        className={`group w-full overflow-hidden rounded-2xl border bg-white/[0.03] text-left transition hover:border-white/20 hover:bg-white/[0.05] ${severity.border}`}
      >
        <div className={`bg-gradient-to-r ${severity.panel} p-5`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityChip severity={normalizeSeverity(finding.severity)} />
                <CategoryChip category={finding.category} />
                {group === "recurring" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/15 px-2.5 py-0.5 text-xs font-semibold text-rose-100">
                    🔁 Recurring
                  </span>
                )}
                {group === "reopened" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-100">
                    ↩︎ Reopened
                  </span>
                )}
                {finding.occurrences >= 5 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/15 px-2.5 py-0.5 text-xs font-semibold text-fuchsia-100">
                    ⚠ Persistent
                  </span>
                )}
              </div>

              <h3 className="mt-3 text-base font-semibold text-white">
                {finding.title || "Untitled finding"}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-400">
                {finding.description || "No description provided by the reviewer."}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="font-mono text-slate-300">{getFileName(finding.filePath)}</span>
                  {finding.lineStart && (
                    <span className="font-mono text-slate-500">
                      L{finding.lineStart}{finding.lineEnd && finding.lineEnd !== finding.lineStart ? `–${finding.lineEnd}` : ""}
                    </span>
                  )}
                </span>
                <span className="text-slate-600">•</span>
                <span>Last seen {formatRelative(finding.lastSeen)}</span>
                <span className="text-slate-600">•</span>
                <span>First seen {formatDate(finding.firstSeen)}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Occurrences</p>
                <p className={`text-2xl font-semibold ${severity.text}`}>{finding.occurrences}x</p>
              </div>
              <motion.span
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-slate-500 group-hover:text-slate-300"
                aria-hidden
              >
                ▾
              </motion.span>
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden border-t border-white/10"
            >
              <div className="grid gap-4 p-5 md:grid-cols-[1.1fr_1fr]">
                <div className="space-y-4">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">File</p>
                    <p className="mt-1 break-all font-mono text-xs text-slate-300">
                      <span className="text-slate-500">{getDirectory(finding.filePath)}/</span>
                      <span className="text-slate-100">{getFileName(finding.filePath)}</span>
                    </p>
                    {finding.lineStart && (
                      <p className="mt-2 font-mono text-[11px] text-slate-500">
                        Lines {finding.lineStart}{finding.lineEnd && finding.lineEnd !== finding.lineStart ? `–${finding.lineEnd}` : ""}
                      </p>
                    )}
                  </div>

                  {finding.explanation && (
                    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Why it matters</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{finding.explanation}</p>
                    </div>
                  )}

                  {finding.suggestion && (
                    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Suggested fix</p>
                      <pre className="hidden-scroll mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950/60 p-3 font-mono text-[11px] leading-5 text-slate-200">
                        {finding.suggestion}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Risk profile</p>
                      <span className={`text-sm font-semibold ${severity.text}`}>
                        {finding.riskScore != null ? finding.riskScore : "—"}
                      </span>
                    </div>
                    <div className="mt-2">
                      <TrendBar value={finding.riskScore || 0} max={100} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
                        <p className="text-slate-500">Blast radius</p>
                        <p className="mt-0.5 capitalize text-slate-200">{finding.blastRadius || "unknown"}</p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
                        <p className="text-slate-500">Confidence</p>
                        <p className="mt-0.5 capitalize text-slate-200">
                          {finding.confidence ? `${Math.round(finding.confidence * 100)}%` : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Activity timeline</p>
                    {timeline.length > 0 ? (
                      <ol className="mt-3 space-y-2">
                        {timeline.slice(0, 5).map((entry, idx) => (
                          <li key={`${entry.runAt}-${idx}`} className="flex items-start justify-between gap-3 text-xs">
                            <div className="flex items-start gap-2">
                              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${severity.dot}`} />
                              <div>
                                <p className="text-slate-200">
                                  {entry.prNumber ? `PR #${entry.prNumber}` : "Review run"}
                                  {entry.prTitle ? <span className="text-slate-500"> · {entry.prTitle}</span> : null}
                                </p>
                                <p className="text-[11px] text-slate-500">{formatDate(entry.runAt)}</p>
                              </div>
                            </div>
                            <span className="shrink-0 text-[11px] text-slate-500">{formatRelative(entry.runAt)}</span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">No timeline data available.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.li>
  );
}

function EmptyState({ repo, owner }) {
  return (
    <motion.div
      variants={itemVariants}
      className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl">
        🗂️
      </div>
      <h3 className="mt-5 text-lg font-semibold text-white">No finding history yet</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        Once reviews run on{" "}
        <span className="font-mono text-slate-200">{owner && repo ? `${owner}/${repo}` : "this repository"}</span>,
        recurring issues, severity trends, and remediation hints will surface here automatically.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Trigger a review</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Open a PR</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Re-run after fixes</span>
      </div>
    </motion.div>
  );
}

export default function FindingHistory({ apiBase, apiFetch, owner, repo }) {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!owner || !repo) {
      setFindings([]);
      return;
    }

    let isActive = true;
    async function loadFindings() {
      setLoading(true);
      setError("");
      try {
        const res = await apiFetch(`${apiBase}/settings/${owner}/${repo}/history?limit=100`);
        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.message || "Unable to load finding history");
        }

        if (!isActive) return;

        const fingerprints = new Map();
        (data.history || []).forEach((run) => {
          (run.findings || []).forEach((f) => {
            const key = fingerprintOf(f);
            if (!fingerprints.has(key)) {
              fingerprints.set(key, {
                ...f,
                severity: normalizeSeverity(f.severity),
                category: normalizeCategory(f.category),
                fingerprint: key,
                occurrences: 0,
                firstSeen: run.createdAt,
                lastSeen: run.createdAt,
                timeline: [],
              });
            }
            const entry = fingerprints.get(key);
            entry.occurrences += 1;
            entry.lastSeen = run.createdAt;
            if (new Date(run.createdAt) < new Date(entry.firstSeen)) {
              entry.firstSeen = run.createdAt;
            }
            entry.timeline.push({
              runAt: run.createdAt,
              prNumber: run.prNumber,
              prTitle: run.prTitle,
              status: run.status,
            });
          });
        });

        const list = Array.from(fingerprints.values()).sort((a, b) => {
          const severityDelta = severityRank[b.severity] - severityRank[a.severity];
          return severityDelta || b.occurrences - a.occurrences || new Date(b.lastSeen) - new Date(a.lastSeen);
        });
        setFindings(list);
      } catch (err) {
        if (isActive) setError(err.message);
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadFindings();
    return () => {
      isActive = false;
    };
  }, [apiBase, apiFetch, owner, repo]);

  const summary = useMemo(() => {
    const recurring = findings.filter((f) => f.occurrences >= 3).length;
    const recent = findings.filter((f) => {
      if (!f.lastSeen) return false;
      return Date.now() - new Date(f.lastSeen).getTime() < 7 * 24 * 60 * 60 * 1000;
    }).length;
    const topFile = findings.reduce((acc, f) => {
      const file = f.filePath || "unknown";
      acc.set(file, (acc.get(file) || 0) + f.occurrences);
      return acc;
    }, new Map());
    const [topFilePath, topFileCount] = Array.from(topFile.entries()).sort((a, b) => b[1] - a[1])[0] || [null, 0];
    return { recurring, recent, topFilePath, topFileCount };
  }, [findings]);

  const filteredFindings = useMemo(() => {
    const term = query.trim().toLowerCase();
    return findings.filter((f) => {
      if (severityFilter !== "all" && f.severity !== severityFilter) return false;
      if (groupFilter !== "all" && classifyGroup(f) !== groupFilter) return false;
      if (!term) return true;
      return (
        (f.title || "").toLowerCase().includes(term) ||
        (f.filePath || "").toLowerCase().includes(term) ||
        (f.description || "").toLowerCase().includes(term) ||
        (f.category || "").toLowerCase().includes(term)
      );
    });
  }, [findings, query, severityFilter, groupFilter]);

  const groupedFindings = useMemo(() => {
    const groups = { recurring: [], reopened: [], fresh: [] };
    filteredFindings.forEach((f) => groups[classifyGroup(f)].push(f));
    return groups;
  }, [filteredFindings]);

  const totalOccurrences = findings.reduce((acc, f) => acc + f.occurrences, 0);
  const repositoryLabel = owner && repo ? `${owner}/${repo}` : "this repository";

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-8"
    >
      <motion.section
        variants={itemVariants}
        className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 p-6 shadow-2xl md:p-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-indigo-200/70">
              Finding intelligence
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              Recurring issues, before they ship
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-400">
              A senior-engineer view of every signal GitGuard raised on{" "}
              <span className="font-mono text-slate-200">{repositoryLabel}</span> — grouped, deduplicated, and ready to act on.
            </p>
          </div>

          <div className="grid w-full max-w-sm grid-cols-3 gap-3 text-center">
            {[
              { label: "Unique", value: findings.length, tone: "text-white" },
              { label: "Hits", value: totalOccurrences, tone: "text-indigo-200" },
              { label: "Recurring", value: summary.recurring, tone: "text-rose-200" },
            ].map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-white/10 bg-black/30 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">{metric.label}</p>
                <p className={`mt-1 text-2xl font-semibold ${metric.tone}`}>{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={itemVariants}
        className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between md:p-5"
      >
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 focus-within:border-indigo-400/50 focus-within:ring-1 focus-within:ring-indigo-400/40">
          <span className="text-slate-500" aria-hidden>🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Search by title, file, category, or description…"
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-full px-2 text-xs text-slate-500 hover:text-slate-200"
            >
              clear
            </button>
          )}
        </div>

        <div className="hidden-scroll flex gap-2 overflow-x-auto pb-1">
          {["all", "critical", "high", "medium", "low"].map((value) => {
            const active = severityFilter === value;
            const style = severityStyles[value];
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSeverityFilter(value)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? value === "all"
                      ? "border-white/20 bg-white text-slate-950"
                      : `${style.chip} ring-1 ${style.ring}`
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {value === "all" ? "All severities" : style.label}
              </button>
            );
          })}
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="grid gap-4 md:grid-cols-3">
        {[
          {
            key: "recurring",
            title: groupMeta.recurring.label,
            description: groupMeta.recurring.description,
            count: groupedFindings.recurring.length,
            accent: "rose",
          },
          {
            key: "reopened",
            title: groupMeta.reopened.label,
            description: groupMeta.reopened.description,
            count: groupedFindings.reopened.length,
            accent: "amber",
          },
          {
            key: "fresh",
            title: groupMeta.fresh.label,
            description: groupMeta.fresh.description,
            count: groupedFindings.fresh.length,
            accent: "cyan",
          },
        ].map((card) => {
          const isActive = groupFilter === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setGroupFilter(isActive ? "all" : card.key)}
              className={`group rounded-3xl border p-5 text-left transition ${
                isActive
                  ? "border-white/30 bg-white/[0.08]"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{card.title}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{card.count}</p>
                </div>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                  card.accent === "rose"
                    ? "border-rose-400/30 bg-rose-500/15 text-rose-100"
                    : card.accent === "amber"
                    ? "border-amber-400/30 bg-amber-500/15 text-amber-100"
                    : "border-cyan-400/30 bg-cyan-500/15 text-cyan-100"
                }`}>
                  {groupFilter === card.key ? "Filtering" : "Filter"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">{card.description}</p>
            </button>
          );
        })}
      </motion.section>

      {loading && (
        <motion.div variants={itemVariants} className="rounded-3xl border border-white/10 bg-white/[0.04] py-14 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-300 border-r-transparent" />
          <p className="text-slate-400">Loading finding history…</p>
        </motion.div>
      )}

      {!loading && error && (
        <motion.div variants={itemVariants} className="rounded-3xl border border-rose-300/25 bg-rose-300/10 px-5 py-4 text-rose-100">
          {error}
        </motion.div>
      )}

      {!loading && !error && findings.length === 0 && (
        <EmptyState owner={owner} repo={repo} />
      )}

      {!loading && !error && findings.length > 0 && (
        <>
          {summary.topFilePath && (
            <motion.section
              variants={itemVariants}
              className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Hottest file</p>
                <p className="mt-1 break-all font-mono text-sm text-slate-200">
                  {summary.topFilePath}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Accumulated {summary.topFileCount} signal{summary.topFileCount === 1 ? "" : "s"} across reviews. Worth a refactor pass.
                </p>
              </div>
              <div className="md:w-64">
                <TrendBar value={summary.topFileCount} max={Math.max(summary.topFileCount, totalOccurrences)} />
                <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                  <span>0</span>
                  <span>{Math.max(summary.topFileCount, totalOccurrences)} signals</span>
                </div>
              </div>
            </motion.section>
          )}

          <motion.section variants={itemVariants} className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {filteredFindings.length === findings.length
                    ? "Findings timeline"
                    : `${filteredFindings.length} matching ${filteredFindings.length === 1 ? "finding" : "findings"}`}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Newest and most severe at the top. Tap a card to see the full timeline and suggested fix.
                </p>
              </div>
              {(query || severityFilter !== "all" || groupFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSeverityFilter("all");
                    setGroupFilter("all");
                  }}
                  className="text-xs font-semibold text-indigo-200 hover:text-indigo-100"
                >
                  Reset filters
                </button>
              )}
            </div>

            {filteredFindings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
                <p className="font-medium text-slate-200">No findings match your filters.</p>
                <p className="mt-1 text-sm text-slate-500">Try clearing the search or selecting a different severity.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {["recurring", "reopened", "fresh"].map((groupKey) => {
                  const items = groupedFindings[groupKey];
                  if (!items.length) return null;
                  const meta = groupMeta[groupKey];
                  return (
                    <div key={groupKey}>
                      <div className="mb-3 flex items-end justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                            {meta.label}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">{meta.description}</p>
                        </div>
                        <span className="text-xs text-slate-500">
                          {items.length} {items.length === 1 ? "item" : "items"}
                        </span>
                      </div>
                      <ul className="space-y-3">
                        <AnimatePresence initial={false}>
                          {items.map((item, idx) => (
                            <FindingRow
                              key={item.fingerprint}
                              finding={item}
                              expanded={expandedId === item.fingerprint}
                              onToggle={() =>
                                setExpandedId((prev) => (prev === item.fingerprint ? null : item.fingerprint))
                              }
                              isLast={idx === items.length - 1}
                            />
                          ))}
                        </AnimatePresence>
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.section>
        </>
      )}
    </motion.div>
  );
}
