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
  repo,
  onSelectPR,
  onOpenSettings,
  repositoryLoading = false,
}) {
  const [history, setHistory] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [linkedRepos, setLinkedRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState("");
  const [showAllRepos, setShowAllRepos] = useState(false);
  const [openPulls, setOpenPulls] = useState([]);
  const [closedPulls, setClosedPulls] = useState([]);
  const [pullsLoading, setPullsLoading] = useState(false);
  const [pullsError, setPullsError] = useState("");
  const [activityMode, setActivityMode] = useState("runs");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanToast, setScanToast] = useState(null);

  const repositoryReady = owner.trim() && repo.trim();

  const loadDashboard = async () => {
    if (!repositoryReady) {
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

  useEffect(() => {
    if (!repositoryReady) return;
    let isActive = true;
    const loadPulls = async (state, setter) => {
      setPullsLoading(true);
      setPullsError("");
      try {
        const response = await apiFetch(`${apiBase}/settings/${owner}/${repo}/pulls?state=${state}`);
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.message || `Unable to load ${state} pull requests`);
        }
        if (isActive) {
          setter(data.pullRequests || []);
        }
      } catch (error) {
        if (isActive) setPullsError(error.message);
      } finally {
        if (isActive) setPullsLoading(false);
      }
    };

    loadPulls("open", setOpenPulls);
    loadPulls("closed", setClosedPulls);
    return () => {
      isActive = false;
    };
  }, [apiBase, apiFetch, owner, repo, repositoryReady]);

  useEffect(() => {
    let isActive = true;
    const loadRepos = async () => {
      setReposLoading(true);
      setReposError("");
      try {
        const response = await apiFetch(`${apiBase}/settings/repositories`);
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.message || "Unable to load connected repositories");
        }
        if (isActive) {
          const sorted = [...(data.repositories || [])]
            .filter((item) => item?.owner && item?.repo)
            .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
          setLinkedRepos(sorted);
        }
      } catch (error) {
        if (isActive) setReposError(error.message);
      } finally {
        if (isActive) setReposLoading(false);
      }
    };

    loadRepos();
    return () => {
      isActive = false;
    };
  }, [apiBase, apiFetch]);

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
  const visibleRepos = showAllRepos ? linkedRepos : linkedRepos.slice(0, 4);
  const showRuns = activityMode === "runs";
  const showOpenPulls = activityMode === "open";
  const activePulls = showOpenPulls ? openPulls : closedPulls;

  const formatConnectedAt = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString();
  };

  const handleRunScanClick = async (prNumber) => {
    if (!owner || !repo) {
      setScanToast(null);
      setMessage("Set a repository before running a scan.");
      return;
    }
    if (!prNumber) {
      setScanToast(null);
      setMessage("Select an open PR to run a scan.");
      return;
    }

    setScanLoading(true);
    setMessage("");
    try {
      const response = await apiFetch(
        `${apiBase}/settings/${owner}/${repo}/pulls/${prNumber}/scan`,
        { method: "POST" },
      );
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Unable to enqueue AI scan");
      }
      const jobText = data.jobId ? ` (job ${data.jobId})` : "";
      setScanToast({
        jobId: data.jobId || "",
        prNumber: data.prNumber,
        status: "queued",
        text: `AI scan queued for PR #${data.prNumber}${jobText}.`,
      });
    } catch (error) {
      setScanToast(null);
      setMessage(error.message);
    } finally {
      setScanLoading(false);
    }
  };

  useEffect(() => {
    if (!scanToast?.jobId || !["queued", "processing"].includes(scanToast.status)) {
      return undefined;
    }

    let isActive = true;
    const pollJob = async () => {
      try {
        const response = await apiFetch(
          `${apiBase}/queue/jobs/status?jobId=${encodeURIComponent(scanToast.jobId)}`,
        );
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.message || "Unable to check scan status");
        }

        const job = data.job || {};
        if (!isActive) return;

        if (job.status === "completed") {
          setScanToast({
            jobId: scanToast.jobId,
            prNumber: scanToast.prNumber,
            status: "completed",
            text: `AI scan completed for PR #${scanToast.prNumber}.`,
          });
          loadDashboard();
          return;
        }

        if (job.status === "failed") {
          setScanToast({
            jobId: scanToast.jobId,
            prNumber: scanToast.prNumber,
            status: "failed",
            text: `AI scan failed for PR #${scanToast.prNumber}: ${job.lastError || "Unknown error"}.`,
          });
          loadDashboard();
          return;
        }

        setScanToast((current) =>
          current?.jobId === scanToast.jobId
            ? { ...current, status: job.status || "queued" }
            : current,
        );
      } catch (error) {
        if (isActive) {
          setScanToast((current) =>
            current?.jobId === scanToast.jobId
              ? { ...current, status: "failed", text: error.message }
              : current,
          );
        }
      }
    };

    pollJob();
    const timer = window.setInterval(pollJob, 1500);
    return () => {
      isActive = false;
      window.clearInterval(timer);
    };
  }, [apiBase, apiFetch, scanToast?.jobId, scanToast?.status]);

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

          <div className="grid min-w-full gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 md:grid-cols-[1fr_auto_auto] xl:min-w-[560px]">
            <div className="min-w-0 space-y-1">
              <span className="text-xs font-medium text-slate-400">Repository</span>
              <p className="truncate rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-100">
                {repositoryLoading
                  ? "Loading linked repository..."
                  : repositoryReady
                    ? `${owner}/${repo}`
                    : "No repository configured"}
              </p>
            </div>
            <button
              onClick={loadDashboard}
              disabled={loading || repositoryLoading || !repositoryReady}
              className="btn-primary self-end px-5 py-3"
            >
              {loading ? "Loading" : "Refresh"}
            </button>
            <button onClick={onOpenSettings} className="btn-secondary self-end px-5 py-3">
              Settings
            </button>
          </div>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {message}
        </div>
      )}

      {scanToast && (
        <div
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
            scanToast.status === "failed"
              ? "border-rose-400/25 bg-rose-400/10 text-rose-100"
              : scanToast.status === "completed"
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                : "border-amber-400/20 bg-amber-400/10 text-amber-100"
          }`}
        >
          {["queued", "processing"].includes(scanToast.status) && (
            <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent" />
          )}
          <span>{scanToast.text}</span>
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

          <div className="hidden-scroll mt-4 flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActivityMode("runs")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                showRuns
                  ? "bg-white text-slate-950"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              Review Runs
            </button>
            <button
              onClick={() => setActivityMode("open")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                showOpenPulls
                  ? "bg-white text-slate-950"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              Open PRs
            </button>
            <button
              onClick={() => setActivityMode("closed")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                activityMode === "closed"
                  ? "bg-white text-slate-950"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              Closed PRs
            </button>
            {showRuns && statusFilters.map((filter) => (
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

          <div className="hidden-scroll mt-5 max-h-[440px] overflow-auto rounded-2xl border border-white/10">
            <table className="min-w-[720px] w-full text-sm">
              <thead className="bg-white/[0.04] text-left text-xs uppercase tracking-wide text-slate-500">
                {showRuns ? (
                  <tr>
                    <th className="px-4 py-3">PR</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Health</th>
                    <th className="px-4 py-3 text-right">Latency</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-4 py-3">PR</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Author</th>
                    <th className="px-4 py-3 text-right">Updated</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-white/10">
                {showRuns && filteredRuns.map((run) => (
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
                        className="btn-action"
                      >
                        Analyze
                      </button>
                    </td>
                  </tr>
                ))}
                {showRuns && !filteredRuns.length && (
                  <tr>
                    <td colSpan="5" className="px-4 py-10 text-center text-slate-500">
                      No review runs match this view.
                    </td>
                  </tr>
                )}
                {!showRuns && pullsLoading && (
                  <tr>
                    <td colSpan="5" className="px-4 py-10 text-center text-slate-500">
                      Loading pull requests...
                    </td>
                  </tr>
                )}
                {!showRuns && !pullsLoading && pullsError && (
                  <tr>
                    <td colSpan="5" className="px-4 py-10 text-center text-amber-200">
                      {pullsError}
                    </td>
                  </tr>
                )}
                {!showRuns && !pullsLoading && !pullsError && activePulls.map((pr) => (
                  <tr key={pr.number} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <p className="font-mono text-cyan-200">#{pr.number}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {pr.title || "Untitled PR"}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{pr.user || "Unknown"}</td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      {pr.updatedAt ? new Date(pr.updatedAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleRunScanClick(pr.number)}
                          className="btn-scan"
                          disabled={scanLoading}
                        >
                          {scanLoading ? "Queuing..." : "Run AI scan"}
                        </button>
                        <a
                          href={pr.url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-view"
                        >
                          View PR
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
                {!showRuns && !pullsLoading && !pullsError && !activePulls.length && (
                  <tr>
                    <td colSpan="5" className="px-4 py-10 text-center text-slate-500">
                      No pull requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Connected Repositories</h2>
              <button onClick={onOpenSettings} className="btn-secondary px-3 py-1.5 text-xs">
                Manage
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Most recently linked repositories</p>

            {reposLoading && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-400">
                Loading connected repositories...
              </div>
            )}

            {!reposLoading && reposError && (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                {reposError}
              </div>
            )}

            {!reposLoading && !reposError && linkedRepos.length === 0 && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-slate-400">
                No repositories connected yet. Link one in Settings.
              </div>
            )}

            {!reposLoading && !reposError && linkedRepos.length > 0 && (
              <div className="mt-4 space-y-3">
                {visibleRepos.map((item) => (
                  <div
                    key={`${item.owner}/${item.repo}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {item.owner}/{item.repo}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.githubUsername ? `Linked as @${item.githubUsername}` : "Linked"}
                      </p>
                      {item.updatedAt && (
                        <p className="text-[11px] text-slate-500">
                          Last connected: {formatConnectedAt(item.updatedAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRunScanClick(openPulls[0]?.number || closedPulls[0]?.number)}
                        className="btn-scan"
                        disabled={scanLoading || (!openPulls.length && !closedPulls.length)}
                        title={
                          !openPulls.length && !closedPulls.length
                            ? "No pull requests to scan"
                            : "Run AI scan on latest PR"
                        }
                      >
                        {scanLoading ? "Queuing..." : "Run AI scan"}
                      </button>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          item.enabled
                            ? "bg-emerald-400/15 text-emerald-200"
                            : "bg-slate-400/15 text-slate-300"
                        }`}
                      >
                        {item.enabled ? "Active" : "Paused"}
                      </span>
                    </div>
                  </div>
                ))}
                {linkedRepos.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setShowAllRepos((value) => !value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
                  >
                    {showAllRepos ? "Show less" : "View all"}
                  </button>
                )}
              </div>
            )}
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
