import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

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

const qualityStyles = {
  excellent: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  good: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  average: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  needsWork: "border-rose-300/30 bg-rose-300/10 text-rose-100",
};

function getQualityScore(issuesPerPR) {
  if (issuesPerPR < 0.5) return { label: "Excellent", key: "excellent", score: 96 };
  if (issuesPerPR < 1) return { label: "Good", key: "good", score: 84 };
  if (issuesPerPR < 2) return { label: "Steady", key: "average", score: 68 };
  return { label: "Coach", key: "needsWork", score: 46 };
}

function initials(name) {
  return String(name || "U")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";
}

function maxOf(items, selector) {
  return Math.max(1, ...items.map(selector));
}

export default function TeamAnalytics({ apiBase, apiFetch, owner, repo }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("findings");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!owner || !repo) return;

    let isActive = true;
    async function loadAnalytics() {
      setLoading(true);
      setError("");
      try {
        const res = await apiFetch(`${apiBase}/settings/${owner}/${repo}/history?limit=100`);
        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.message || "Unable to load team analytics");
        }

        if (isActive) {
          const authorStats = {};
          (data.history || []).forEach((run) => {
            const author = run.prAuthor || "unknown";
            if (!authorStats[author]) {
              authorStats[author] = {
                prs: 0,
                findings: 0,
                commentsPosted: 0,
                completed: 0,
                failed: 0,
                severity: { critical: 0, high: 0, medium: 0, low: 0 },
              };
            }
            authorStats[author].prs += 1;
            authorStats[author].commentsPosted += run.commentsPosted || 0;
            if (run.status === "completed") authorStats[author].completed += 1;
            if (run.status === "failed") authorStats[author].failed += 1;
            (run.findings || []).forEach((finding) => {
              const severity = finding.severity || "low";
              authorStats[author].findings += 1;
              authorStats[author].severity[severity] = (authorStats[author].severity[severity] || 0) + 1;
            });
          });

          setAnalytics(
            Object.entries(authorStats)
              .map(([author, stats]) => ({
                author,
                ...stats,
                issuesPerPR: Number((stats.findings / Math.max(1, stats.prs)).toFixed(2)),
                completionRate: Number(((stats.completed / Math.max(1, stats.prs)) * 100).toFixed(0)),
              }))
              .sort((a, b) => b.findings - a.findings),
          );
        }
      } catch (err) {
        if (isActive) setError(err.message);
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadAnalytics();
    return () => {
      isActive = false;
    };
  }, [apiBase, apiFetch, owner, repo]);

  const sortedAnalytics = useMemo(() => {
    if (!analytics) return [];
    const sorted = [...analytics];
    if (sortBy === "prs") return sorted.sort((a, b) => b.prs - a.prs);
    if (sortBy === "quality") return sorted.sort((a, b) => a.issuesPerPR - b.issuesPerPR);
    if (sortBy === "critical") return sorted.sort((a, b) => b.severity.critical - a.severity.critical);
    return sorted.sort((a, b) => b.findings - a.findings);
  }, [analytics, sortBy]);

  const overallStats = useMemo(() => {
    if (!analytics || !analytics.length) return null;
    const totalPRs = analytics.reduce((acc, item) => acc + item.prs, 0);
    const totalFindings = analytics.reduce((acc, item) => acc + item.findings, 0);
    const totalCompleted = analytics.reduce((acc, item) => acc + item.completed, 0);
    const avgIssuesPerPR = Number((totalFindings / Math.max(1, totalPRs)).toFixed(2));

    return {
      totalAuthors: analytics.length,
      totalPRs,
      totalFindings,
      avgIssuesPerPR,
      completionRate: Number(((totalCompleted / Math.max(1, totalPRs)) * 100).toFixed(0)),
    };
  }, [analytics]);

  const maxFindings = maxOf(sortedAnalytics, (item) => item.findings);
  const maxPRs = maxOf(sortedAnalytics, (item) => item.prs);
  const spotlight = sortedAnalytics[0];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 pb-8"
    >
      <motion.section variants={itemVariants} className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#101014] p-6 shadow-2xl md:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[linear-gradient(135deg,transparent,rgba(45,212,191,0.16),rgba(251,191,36,0.12))] lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-teal-200/70">
              Review floor
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              Team Analytics
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-400">
              A contributor-level operating view for review load, finding density, and coaching signals.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Workspace</p>
            <p className="mt-2 break-all font-mono text-sm text-slate-200">
              {owner && repo ? `${owner}/${repo}` : "No repository connected"}
            </p>
            {overallStats && (
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-xl font-semibold text-white">{overallStats.totalAuthors}</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">People</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-xl font-semibold text-white">{overallStats.totalPRs}</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">PRs</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-3">
                  <p className="text-xl font-semibold text-white">{overallStats.completionRate}%</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Done</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {loading && (
        <motion.div variants={itemVariants} className="rounded-3xl border border-white/10 bg-white/[0.04] py-12 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-teal-300 border-r-transparent" />
          <p className="text-slate-400">Analyzing team review patterns...</p>
        </motion.div>
      )}

      {!loading && error && (
        <motion.div variants={itemVariants} className="rounded-3xl border border-rose-300/25 bg-rose-300/10 px-5 py-4 text-rose-100">
          {error}
        </motion.div>
      )}

      {!loading && overallStats && (
        <>
          <motion.section variants={itemVariants} className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Finding density", value: overallStats.avgIssuesPerPR, hint: "Issues per PR", tone: "bg-teal-300/10 text-teal-100 border-teal-300/25" },
              { label: "Review volume", value: overallStats.totalPRs, hint: "Pull requests sampled", tone: "bg-sky-300/10 text-sky-100 border-sky-300/25" },
              { label: "Open coaching", value: overallStats.totalFindings, hint: "Total findings", tone: "bg-amber-300/10 text-amber-100 border-amber-300/25" },
              { label: "Completion", value: `${overallStats.completionRate}%`, hint: "Completed runs", tone: "bg-emerald-300/10 text-emerald-100 border-emerald-300/25" },
            ].map((metric) => (
              <div key={metric.label} className={`rounded-[24px] border p-5 ${metric.tone}`}>
                <p className="text-sm opacity-75">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
                <p className="mt-2 text-xs opacity-70">{metric.hint}</p>
              </div>
            ))}
          </motion.section>

          <motion.section variants={itemVariants} className="grid gap-6 xl:grid-cols-[360px_1fr]">
            <aside className="space-y-4">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Sort lens
                </p>
                <div className="mt-4 grid gap-2">
                  {[
                    { value: "findings", label: "Finding load" },
                    { value: "prs", label: "Review volume" },
                    { value: "quality", label: "Best quality" },
                    { value: "critical", label: "Critical pressure" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSortBy(option.value)}
                      className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                        sortBy === option.value
                          ? "bg-white text-slate-950"
                          : "border border-white/10 bg-black/20 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[#12120f] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Spotlight
                </p>
                {spotlight ? (
                  <div className="mt-4">
                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-teal-300 text-lg font-bold text-slate-950">
                      {initials(spotlight.author)}
                    </div>
                    <p className="mt-4 break-all text-lg font-semibold text-white">{spotlight.author}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {spotlight.findings} findings across {spotlight.prs} PRs, with {spotlight.issuesPerPR} issues per PR.
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-400">No contributor activity yet.</p>
                )}
              </div>
            </aside>

            <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5">
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Contributor lanes</h2>
                  <p className="mt-1 text-sm text-slate-500">Each lane shows volume, finding density, and severity pressure.</p>
                </div>
              </div>

              <div className="space-y-3">
                {sortedAnalytics.map((author, index) => {
                  const quality = getQualityScore(author.issuesPerPR);
                  const qualityClass = qualityStyles[quality.key];
                  const findingsWidth = Math.max(4, (author.findings / maxFindings) * 100);
                  const prWidth = Math.max(4, (author.prs / maxPRs) * 100);

                  return (
                    <motion.article
                      key={author.author}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.035, 0.3) }}
                      className="rounded-[24px] border border-white/10 bg-black/25 p-4"
                    >
                      <div className="grid gap-4 lg:grid-cols-[220px_1fr_170px] lg:items-center">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-sm font-bold text-slate-950">
                            {initials(author.author)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">{author.author}</p>
                            <p className="text-xs text-slate-500">Contributor</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="mb-1 flex justify-between text-xs text-slate-500">
                              <span>Findings</span>
                              <span>{author.findings}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full bg-amber-300" style={{ width: `${findingsWidth}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 flex justify-between text-xs text-slate-500">
                              <span>PR volume</span>
                              <span>{author.prs}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full bg-teal-300" style={{ width: `${prWidth}%` }} />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center">
                          <span className={`col-span-2 rounded-full border px-3 py-1 text-xs font-semibold ${qualityClass}`}>
                            {quality.label} | {author.issuesPerPR}/PR
                          </span>
                          <div className="rounded-2xl bg-rose-300/10 p-2">
                            <p className="text-sm font-semibold text-rose-100">{author.severity.critical}</p>
                            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Critical</p>
                          </div>
                          <div className="rounded-2xl bg-orange-300/10 p-2">
                            <p className="text-sm font-semibold text-orange-100">{author.severity.high}</p>
                            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">High</p>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </section>
          </motion.section>

          <motion.section variants={itemVariants} className="rounded-[28px] border border-teal-300/20 bg-teal-300/10 p-5">
            <h2 className="text-xl font-semibold text-white">Review floor insight</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Treat this page as a coaching map, not a scoreboard. Pair high finding density with review context:
              large PRs, risky files, and incomplete scans can skew the signal. Use the lanes to decide where to
              add guardrails, pairing, or smaller pull request habits.
            </p>
          </motion.section>
        </>
      )}

      {!loading && !error && (!analytics || analytics.length === 0) && (
        <motion.div variants={itemVariants} className="rounded-[28px] border border-white/10 bg-white/[0.04] py-12 text-center">
          <p className="font-medium text-slate-300">No team data available yet</p>
          <p className="mt-1 text-sm text-slate-500">Run reviews on pull requests to see contributor analytics.</p>
        </motion.div>
      )}
    </motion.div>
  );
}
