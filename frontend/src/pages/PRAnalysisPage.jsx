import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

function formatMs(ms) {
  if (ms === undefined || ms === null) return "N/A";
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function severityClass(severity) {
  const map = {
    critical: "border-red-400/30 bg-red-400/10 text-red-200",
    high: "border-orange-400/30 bg-orange-400/10 text-orange-200",
    medium: "border-amber-400/30 bg-amber-400/10 text-amber-100",
    low: "border-cyan-400/30 bg-cyan-400/10 text-cyan-100",
  };
  return map[severity] || map.low;
}

export default function PRAnalysisPage({
  apiBase,
  apiFetch,
  owner,
  repo,
  prNumber,
  onPrNumberChange,
  onClose,
}) {
  const [draftPRNumber, setDraftPRNumber] = useState(prNumber || "");
  const [activePRNumber, setActivePRNumber] = useState(prNumber || "");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(Boolean(prNumber));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!prNumber) return;
    setDraftPRNumber(prNumber);
    setActivePRNumber(prNumber);
  }, [prNumber]);

  useEffect(() => {
    if (!activePRNumber) {
      setLoading(false);
      return;
    }

    if (!owner || !repo) {
      setError("Missing repository information.");
      setLoading(false);
      return;
    }

    async function fetchAnalysis() {
      setLoading(true);
      setError("");
      try {
        const response = await apiFetch(
          `${apiBase}/settings/${owner}/${repo}/runs/${activePRNumber}`,
        );
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.message || "Failed to fetch PR analysis");
        }
        setAnalysis(data.analysis);
      } catch (err) {
        setAnalysis(null);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalysis();
  }, [apiBase, apiFetch, owner, repo, activePRNumber]);

  const submitLookup = (event) => {
    event.preventDefault();
    const next = String(draftPRNumber || "").trim();
    setAnalysis(null);
    setActivePRNumber(next);
    onPrNumberChange?.(next);
  };

  const Header = () => (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
            Pull Request Analysis
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            Inspect a completed AI review run.
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Load findings, suggested fixes, timing, and the GitHub PR link from one workspace.
          </p>
        </div>
        <form onSubmit={submitLookup} className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            type="number"
            min="1"
            value={draftPRNumber}
            onChange={(event) => setDraftPRNumber(event.target.value)}
            placeholder="PR number"
            className="control-input"
          />
          <button type="submit" className="btn-primary">
            Load Analysis
          </button>
          {onClose && (
            <button type="button" onClick={onClose} className="btn-secondary">
              Back
            </button>
          )}
        </form>
      </div>
    </section>
  );

  if (!activePRNumber) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <Header />
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.025] p-10 text-center">
          <p className="text-lg font-medium text-white">No PR selected yet</p>
          <p className="mt-2 text-sm text-slate-400">
            Use the lookup above or open a run from the Dashboard activity table.
          </p>
        </div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <Header />
        <div className="flex items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] py-16">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-cyan-300 border-r-transparent" />
            <p className="text-slate-300">Loading PR analysis...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <Header />
        <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-6 text-red-100">
          {error}
        </div>
      </motion.div>
    );
  }

  if (!analysis) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <Header />
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-slate-300">
          No analysis available for this PR yet.
        </div>
      </motion.div>
    );
  }

  const findings = analysis.findings || [];
  const timings = analysis.timingsMs || {};

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Header />

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm text-slate-500">PR #{analysis.prNumber}</p>
            <h2 className="mt-1 text-3xl font-semibold text-white">{analysis.prTitle || "Untitled PR"}</h2>
            <p className="mt-2 text-sm text-slate-400">
              {analysis.prAuthor || "Unknown author"} · {analysis.status || "unknown"}
            </p>
          </div>
          <a
            href={`https://github.com/${owner}/${repo}/pull/${analysis.prNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-center"
          >
            View on GitHub
          </a>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {[
            ["Findings", findings.length],
            ["Comments", analysis.commentsPosted || 0],
            ["Avg Risk", `${(analysis.avgRiskScore || 0).toFixed(1)}/100`],
            ["Files Changed", analysis.filesChanged || 0],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-xl font-semibold text-white">Performance</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {[
            ["PR Open to LLM", formatMs(timings.prOpenToLlmResponse)],
            ["Diff Fetch", formatMs(timings.fetchDiff)],
            ["LLM Analysis", formatMs(timings.llmAnalysis)],
            ["Comment Post", formatMs(timings.commentPost)],
            ["Total", formatMs(timings.total)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-2 font-semibold text-cyan-100">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Findings</h2>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
            {findings.length} total
          </span>
        </div>

        {!findings.length ? (
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-8 text-center text-emerald-100">
            No issues were detected for this PR.
          </div>
        ) : (
          findings.map((finding, index) => (
            <motion.article
              key={`${finding.fingerprint || finding.filePath}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{finding.title}</h3>
                  <p className="mt-1 font-mono text-xs text-slate-500">{finding.filePath}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityClass(finding.severity)}`}>
                    {finding.severity || "low"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                    {finding.category || "correctness"}
                  </span>
                </div>
              </div>

              {finding.explanation && (
                <p className="mt-4 text-sm leading-6 text-slate-300">{finding.explanation}</p>
              )}

              {finding.suggestion && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                  <div className="border-b border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Suggested Fix
                  </div>
                  <pre className="overflow-auto p-4 text-xs leading-6 text-slate-200">{finding.suggestion}</pre>
                </div>
              )}

              <div className="mt-4 grid gap-3 text-xs md:grid-cols-3">
                <div className="rounded-2xl bg-black/20 p-3">
                  <p className="text-slate-500">Risk Score</p>
                  <p className="mt-1 text-slate-100">{finding.riskScore || 0}/100</p>
                </div>
                <div className="rounded-2xl bg-black/20 p-3">
                  <p className="text-slate-500">Confidence</p>
                  <p className="mt-1 text-slate-100">{Math.round((finding.confidence || 0) * 100)}%</p>
                </div>
                <div className="rounded-2xl bg-black/20 p-3">
                  <p className="text-slate-500">Blast Radius</p>
                  <p className="mt-1 text-slate-100">{finding.blastRadius || "low"}</p>
                </div>
              </div>
            </motion.article>
          ))
        )}
      </section>
    </motion.div>
  );
}
