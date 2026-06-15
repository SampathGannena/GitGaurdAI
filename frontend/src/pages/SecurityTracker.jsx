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

const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };

const severityStyles = {
  critical: {
    label: "Critical",
    tone: "border-rose-300/30 bg-rose-300/10 text-rose-100",
    bar: "bg-rose-400",
    panel: "from-rose-950/45 to-slate-950",
  },
  high: {
    label: "High",
    tone: "border-orange-300/30 bg-orange-300/10 text-orange-100",
    bar: "bg-orange-300",
    panel: "from-orange-950/40 to-slate-950",
  },
  medium: {
    label: "Medium",
    tone: "border-amber-300/30 bg-amber-300/10 text-amber-100",
    bar: "bg-amber-300",
    panel: "from-amber-950/35 to-slate-950",
  },
  low: {
    label: "Low",
    tone: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
    bar: "bg-cyan-300",
    panel: "from-cyan-950/35 to-slate-950",
  },
};

function normalizeSeverity(value) {
  const severity = String(value || "low").toLowerCase();
  return severityStyles[severity] ? severity : "low";
}

function formatDate(date) {
  if (!date) return "Unknown";
  return new Date(date).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSecurityPosture(stats) {
  if (stats.critical > 0) {
    return {
      label: "Block release",
      copy: "Critical security findings require remediation or a documented exception.",
      tone: "border-rose-300/30 bg-rose-300/10 text-rose-100",
    };
  }
  if (stats.high > 0) {
    return {
      label: "Security review required",
      copy: "High severity findings should be triaged before merge or deployment.",
      tone: "border-orange-300/30 bg-orange-300/10 text-orange-100",
    };
  }
  if (stats.total > 0) {
    return {
      label: "Monitor",
      copy: "Security findings exist, but no high or critical blockers are present.",
      tone: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
    };
  }
  return {
    label: "Clear",
    copy: "No security findings were detected in recent review history.",
    tone: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  };
}

export default function SecurityTracker({ apiBase, apiFetch, owner, repo }) {
  const [securityFindings, setSecurityFindings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!owner || !repo) {
      setSecurityFindings([]);
      return;
    }

    let isActive = true;
    async function loadSecurity() {
      setLoading(true);
      setError("");
      try {
        const res = await apiFetch(`${apiBase}/settings/${owner}/${repo}/history?limit=100`);
        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.message || "Unable to load security findings");
        }

        if (isActive) {
          const securityIssues = [];
          (data.history || []).forEach((run) => {
            (run.findings || []).forEach((finding) => {
              if (finding.category === "security") {
                securityIssues.push({
                  ...finding,
                  severity: normalizeSeverity(finding.severity),
                  prNumber: run.prNumber,
                  timestamp: run.updatedAt || run.createdAt,
                  prTitle: run.prTitle,
                  runStatus: run.status,
                });
              }
            });
          });

          securityIssues.sort((a, b) => {
            const severityDelta = severityRank[b.severity] - severityRank[a.severity];
            return severityDelta || (b.riskScore || 0) - (a.riskScore || 0) || new Date(b.timestamp) - new Date(a.timestamp);
          });
          setSecurityFindings(securityIssues);
        }
      } catch (err) {
        if (isActive) setError(err.message);
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadSecurity();
    return () => {
      isActive = false;
    };
  }, [apiBase, apiFetch, owner, repo]);

  const stats = useMemo(() => ({
    total: securityFindings.length,
    critical: securityFindings.filter((finding) => finding.severity === "critical").length,
    high: securityFindings.filter((finding) => finding.severity === "high").length,
    medium: securityFindings.filter((finding) => finding.severity === "medium").length,
    low: securityFindings.filter((finding) => finding.severity === "low").length,
  }), [securityFindings]);

  const filteredFindings = securityFindings.filter((item) => (
    filter === "all" ? true : item.severity === filter
  ));
  const posture = getSecurityPosture(stats);
  const highestRisk = securityFindings[0];
  const affectedFiles = new Set(securityFindings.map((finding) => finding.filePath)).size;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 pb-8"
    >
      <motion.section
        variants={itemVariants}
        className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/30 p-6 shadow-2xl md:p-8"
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-rose-200/70">
              Security operations
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              Security Vulnerability Tracker
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-400">
              Triage security findings by severity, file ownership, and release impact.
            </p>
          </div>

          <div className={`rounded-2xl border p-4 ${posture.tone}`}>
            <p className="text-xs uppercase tracking-[0.24em] opacity-80">Posture</p>
            <p className="mt-2 text-2xl font-semibold text-white">{posture.label}</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">{posture.copy}</p>
          </div>
        </div>
      </motion.section>

      {loading && (
        <motion.div variants={itemVariants} className="rounded-3xl border border-white/10 bg-white/[0.04] py-12 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-rose-300 border-r-transparent" />
          <p className="text-slate-400">Loading security findings...</p>
        </motion.div>
      )}

      {!loading && error && (
        <motion.div variants={itemVariants} className="rounded-3xl border border-rose-300/25 bg-rose-300/10 px-5 py-4 text-rose-100">
          {error}
        </motion.div>
      )}

      {!loading && !error && (
        <>
          <motion.section variants={itemVariants} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Total", value: stats.total, hint: `${affectedFiles} affected files`, severity: "low" },
              { label: "Critical", value: stats.critical, hint: "Release blockers", severity: "critical" },
              { label: "High", value: stats.high, hint: "Needs triage", severity: "high" },
              { label: "Medium", value: stats.medium, hint: "Track and fix", severity: "medium" },
              { label: "Low", value: stats.low, hint: "Backlog candidates", severity: "low" },
            ].map((metric) => {
              const style = severityStyles[metric.severity];
              return (
                <div key={metric.label} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-500">{metric.label}</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
                    </div>
                    <span className={`h-3 w-3 rounded-full ${style.bar}`} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{metric.hint}</p>
                </div>
              );
            })}
          </motion.section>

          <motion.section variants={itemVariants} className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-xl font-semibold text-white">Command summary</h2>
              <p className="mt-1 text-sm text-slate-500">
                Current security signal for {owner && repo ? `${owner}/${repo}` : "the connected repository"}.
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Highest risk</p>
                  {highestRisk ? (
                    <>
                      <p className="mt-2 font-medium text-white">{highestRisk.title || "Security finding"}</p>
                      <p className="mt-1 break-all font-mono text-xs text-slate-500">{highestRisk.filePath}</p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityStyles[highestRisk.severity].tone}`}>
                          {severityStyles[highestRisk.severity].label}
                        </span>
                        <span className="font-mono text-sm text-amber-200">Risk {highestRisk.riskScore || 0}</span>
                      </div>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">No security findings detected.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Triage guidance</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Prioritize critical and high findings first, verify exploitability, then patch and rerun the review scan to capture fresh evidence.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Finding queue</h2>
                  <p className="mt-1 text-sm text-slate-500">Sorted by severity, risk score, and recency.</p>
                </div>
                <div className="hidden-scroll flex gap-2 overflow-x-auto pb-1">
                  {["all", "critical", "high", "medium", "low"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value)}
                      className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                        filter === value
                          ? "bg-white text-slate-950"
                          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {value === "all" ? "All" : severityStyles[value].label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredFindings.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {filteredFindings.map((item, index) => {
                    const style = severityStyles[item.severity];
                    return (
                      <motion.article
                        key={`${item.filePath}-${item.title}-${index}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.03, 0.25) }}
                        className={`rounded-2xl border bg-gradient-to-br ${style.panel} p-4`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-base font-semibold text-white">{item.title || "Security finding"}</p>
                            <p className="mt-1 break-all font-mono text-xs text-slate-500">{item.filePath}</p>
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${style.tone}`}>
                            {style.label}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm md:grid-cols-4">
                          <div>
                            <p className="text-xs text-slate-500">PR</p>
                            <p className="mt-1 font-semibold text-slate-200">#{item.prNumber}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Risk</p>
                            <p className="mt-1 font-semibold text-amber-200">{item.riskScore || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Blast radius</p>
                            <p className="mt-1 capitalize text-slate-200">{item.blastRadius || "unknown"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Detected</p>
                            <p className="mt-1 text-xs text-slate-300">{formatDate(item.timestamp)}</p>
                          </div>
                        </div>

                        {item.explanation && (
                          <div className="mt-4 border-t border-white/10 pt-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Why this matters</p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">{item.explanation}</p>
                          </div>
                        )}

                        {item.suggestion && (
                          <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Suggested fix</p>
                            <pre className="hidden-scroll mt-2 max-h-32 overflow-auto whitespace-pre-wrap font-mono text-xs leading-5 text-slate-300">
                              {item.suggestion}
                            </pre>
                          </div>
                        )}
                      </motion.article>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-12 text-center">
                  <p className="font-medium text-slate-200">
                    {securityFindings.length ? "No findings for this severity." : "No security findings detected."}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {securityFindings.length ? "Adjust the filter to inspect another severity." : "Run reviews on PRs to keep the security queue fresh."}
                  </p>
                </div>
              )}
            </div>
          </motion.section>
        </>
      )}
    </motion.div>
  );
}
