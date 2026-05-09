import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const statusFilters = ["all", "completed", "failed", "skipped", "processing"];

function formatMs(ms) {
  if (!ms) return "N/A";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function getRunHealth(run) {
  if (run.status === "failed") return "Needs attention";
  if (run.status === "skipped") return "Skipped";
  if ((run.commentsPosted || 0) > 0) return "Findings posted";
  return "Clean";
}

export default function Dashboard({
  apiBase,
  apiFetch,
  owner,
  setOwner,
  repo,
  setRepo,
  onSelectPR,
  onOpenSettings,
}) {
  const [history, setHistory] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  const repositoryReady = owner.trim() && repo.trim();

  const loadDashboard = async () => {
    if (!repositoryReady) {
      setMessage("Enter a GitHub owner and repository to load review activity.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const [historyRes, insightsRes] = await Promise.all([
        apiFetch(`${apiBase}/settings/${owner}/${repo}/history?limit=50`),
        apiFetch(`${apiBase}/settings/${owner}/${repo}/insights`),
      ]);
      const historyData = await historyRes.json();
      const insightsData = await insightsRes.json();

      if (!historyData.ok) throw new Error("Unable to load review history");
      setHistory(historyData.history || []);
      setInsights(insightsData.insights || null);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (repositoryReady) loadDashboard();
  }, [owner, repo]);

  const filteredRuns = useMemo(() => {
    return history.filter((run) => {
      const matchesStatus = statusFilter === "all" || run.status === statusFilter;
      const matchesQuery =
        !query ||
        String(run.prNumber).includes(query) ||
        (run.prTitle || "").toLowerCase().includes(query.toLowerCase()) ||
        (run.prAuthor || "").toLowerCase().includes(query.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [history, statusFilter, query]);

  const totals = useMemo(() => {
    const completed = history.filter((run) => run.status === "completed");
    const findings = history.reduce((sum, run) => sum + (run.findings?.length || 0), 0);
    const comments = history.reduce((sum, run) => sum + (run.commentsPosted || 0), 0);
    const avgLlm = completed.length
      ? Math.round(
          completed.reduce((sum, run) => sum + (run.timingsMs?.llmAnalysis || 0), 0) /
            completed.length,
        )
      : 0;

    return {
      totalRuns: history.length,
      completed: completed.length,
      findings,
      comments,
      avgLlm,
    };
  }, [history]);

  const latestRun = history[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
              Production Review Console
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
              Ship safer pull requests with an AI review loop.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Monitor webhook runs, LLM findings, review latency, and comment delivery from one
              operational dashboard.
            </p>
          </div>

          <div className="grid min-w-full gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 md:grid-cols-[1fr_1fr_auto] xl:min-w-[560px]">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-400">Owner</span>
              <input
                value={owner}
                onChange={(event) => setOwner(event.target.value)}
                placeholder="SampathGannena"
                className="control-input"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-400">Repository</span>
              <input
                value={repo}
                onChange={(event) => setRepo(event.target.value)}
                placeholder="gitguard-ai-sentinel"
                className="control-input"
              />
            </label>
            <button
              onClick={loadDashboard}
              disabled={loading || !repositoryReady}
              className="btn-primary self-end px-5 py-3"
            >
              {loading ? "Loading" : "Refresh"}
            </button>
          </div>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {message}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total Runs", value: insights?.totalRuns ?? totals.totalRuns, hint: "Webhook reviews" },
          { label: "Completed", value: insights?.completedRuns ?? totals.completed, hint: "Successful analyses" },
          { label: "Findings", value: totals.findings, hint: "Issues detected" },
          { label: "Comments", value: totals.comments, hint: "Posted to GitHub" },
          { label: "Avg LLM", value: formatMs(totals.avgLlm), hint: "Analysis time" },
        ].map((metric) => (
          <motion.div
            key={metric.label}
            whileHover={{ y: -3 }}
            className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"
          >
            <p className="text-xs text-slate-500">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{metric.value}</p>
            <p className="mt-1 text-xs text-slate-400">{metric.hint}</p>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Review Activity</h2>
              <p className="text-sm text-slate-400">Filter runs and open full PR analysis.</p>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search PR, title, author"
              className="control-input md:w-64"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  statusFilter === filter
                    ? "bg-white text-slate-950"
                    : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">PR</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Health</th>
                  <th className="px-4 py-3 text-right">Latency</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredRuns.map((run) => (
                  <tr key={`${run.prNumber}-${run.headSha}`} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <p className="font-mono text-cyan-200">#{run.prNumber}</p>
                      <p className="max-w-[260px] truncate text-xs text-slate-500">
                        {run.prTitle || "Untitled PR"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`status-pill status-${run.status}`}>{run.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{getRunHealth(run)}</td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      {formatMs(run.timingsMs?.total)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onSelectPR(run.prNumber)}
                        className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium text-cyan-100 hover:bg-cyan-300/20"
                      >
                        Analyze
                      </button>
                    </td>
                  </tr>
                ))}
                {!filteredRuns.length && (
                  <tr>
                    <td colSpan="5" className="px-4 py-10 text-center text-slate-500">
                      No review runs match this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-semibold text-white">Pipeline</h2>
            <div className="mt-5 space-y-3">
              {[
                ["Webhook", "HMAC verified pull_request event"],
                ["Diff", "Raw GitHub .diff fetched and parsed"],
                ["LLM", "Changed lines reviewed for risk"],
                ["Comment", "Markdown review posted to PR"],
              ].map(([label, text], index) => (
                <div key={label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-cyan-300/15 text-xs font-semibold text-cyan-100">
                      {index + 1}
                    </div>
                    {index < 3 && <div className="h-8 w-px bg-white/10" />}
                  </div>
                  <div>
                    <p className="font-medium text-white">{label}</p>
                    <p className="text-sm text-slate-400">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-300/10 to-violet-400/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
              Latest Run
            </p>
            {latestRun ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-semibold text-white">PR #{latestRun.prNumber}</p>
                  <span className={`status-pill status-${latestRun.status}`}>{latestRun.status}</span>
                </div>
                <p className="text-sm text-slate-300">{latestRun.prTitle || "Untitled PR"}</p>
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="text-slate-500">Files</p>
                    <p className="mt-1 text-lg text-white">{latestRun.filesChanged || 0}</p>
                  </div>
                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="text-slate-500">Hunks</p>
                    <p className="mt-1 text-lg text-white">{latestRun.hunksAnalyzed || 0}</p>
                  </div>
                  <div className="rounded-xl bg-black/20 p-3">
                    <p className="text-slate-500">Risk</p>
                    <p className="mt-1 text-lg text-white">{latestRun.avgRiskScore || 0}</p>
                  </div>
                </div>
                <button onClick={onOpenSettings} className="btn-secondary w-full">
                  Tune Review Rules
                </button>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">
                Open a PR or load a repository with history to see live activity.
              </p>
            )}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
