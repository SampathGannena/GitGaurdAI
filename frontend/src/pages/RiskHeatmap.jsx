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

const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };

const severityStyles = {
  low: {
    label: "Low",
    cell: "bg-emerald-600 hover:bg-emerald-500",
    dot: "bg-emerald-500",
    text: "text-emerald-200",
    border: "border-emerald-400/25",
    panel: "bg-emerald-400/10",
  },
  medium: {
    label: "Medium",
    cell: "bg-violet-600 hover:bg-violet-500",
    dot: "bg-violet-500",
    text: "text-violet-200",
    border: "border-violet-400/25",
    panel: "bg-violet-400/10",
  },
  high: {
    label: "High",
    cell: "bg-amber-500 hover:bg-amber-400",
    dot: "bg-amber-500",
    text: "text-amber-200",
    border: "border-amber-400/25",
    panel: "bg-amber-400/10",
  },
  critical: {
    label: "Critical",
    cell: "bg-rose-700 hover:bg-rose-600",
    dot: "bg-rose-600",
    text: "text-rose-200",
    border: "border-rose-400/25",
    panel: "bg-rose-400/10",
  },
};

function normalizeSeverity(severity) {
  const value = String(severity || "").toLowerCase();
  return severityStyles[value] ? value : "low";
}

function getWorstSeverity(findings) {
  return findings.reduce((worst, finding) => {
    const severity = normalizeSeverity(finding.severity);
    return severityOrder[severity] > severityOrder[worst] ? severity : worst;
  }, "low");
}

function getFileName(path) {
  return String(path || "Unknown file").split(/[\\/]/).pop() || path;
}

export default function RiskHeatmap({ apiBase, apiFetch, owner, repo }) {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!owner || !repo) return;

    let isActive = true;
    async function loadHeatmap() {
      setLoading(true);
      try {
        const res = await apiFetch(`${apiBase}/settings/${owner}/${repo}/history?limit=50`);
        const data = await res.json();

        if (data.ok && data.history && isActive) {
          const fileRisks = new Map();
          data.history.forEach((run) => {
            (run.findings || []).forEach((finding) => {
              const filePath = finding.filePath || "Unknown file";
              const current = fileRisks.get(filePath) || {
                filePath,
                findings: [],
                scores: [],
                lastSeen: run.updatedAt || run.createdAt,
              };
              current.findings.push(finding);
              current.scores.push(Number(finding.riskScore || 0));
              current.lastSeen = run.updatedAt || run.createdAt || current.lastSeen;
              fileRisks.set(filePath, current);
            });
          });

          const result = Array.from(fileRisks.values()).map((item) => {
            const severity = getWorstSeverity(item.findings);
            const avgRisk = item.scores.length
              ? Number((item.scores.reduce((a, b) => a + b, 0) / item.scores.length).toFixed(1))
              : 0;
            return {
              ...item,
              severity,
              avgRisk,
              maxRisk: Math.max(...item.scores, 0),
              occurrences: item.findings.length,
              topFinding: item.findings
                .slice()
                .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))[0],
            };
          });

          result.sort((a, b) => {
            const severityDelta = severityOrder[b.severity] - severityOrder[a.severity];
            return severityDelta || b.maxRisk - a.maxRisk || b.occurrences - a.occurrences;
          });
          setHeatmapData(result);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadHeatmap();
    return () => {
      isActive = false;
    };
  }, [apiBase, apiFetch, owner, repo]);

  const stats = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    heatmapData.forEach((item) => {
      counts[item.severity] += 1;
    });
    return {
      total: heatmapData.length,
      ...counts,
    };
  }, [heatmapData]);

  const filteredData = heatmapData.filter((item) => filter === "all" || item.severity === filter);
  const topHotspots = heatmapData.slice(0, 4);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 pb-8"
    >
      <motion.section
        variants={itemVariants}
        className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-violet-950/45 via-slate-950 to-cyan-950/35 p-6 shadow-2xl md:p-8"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-400">
          Insights
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
          Code health intelligence
        </h1>
        <p className="mt-3 max-w-3xl text-base text-slate-400 md:text-lg">
          Patterns, hotspots and AI-generated recommendations across {owner && repo ? `${owner}/${repo}` : "your workspace"}.
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-xl shadow-black/20">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl text-amber-300">Risk Heatmap</span>
              </div>
              <h2 className="mt-1 text-2xl font-semibold text-white">Risk Heatmap</h2>
              <p className="mt-1 text-sm text-slate-400">
                File frequency x severity from recent review runs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>Low</span>
              {["low", "medium", "high", "critical"].map((severity) => (
                <span
                  key={severity}
                  className={`h-3.5 w-3.5 rounded-full ${severityStyles[severity].dot}`}
                  title={severityStyles[severity].label}
                />
              ))}
              <span>Critical</span>
            </div>
          </div>

          <div className="hidden-scroll mt-6 flex gap-2 overflow-x-auto pb-1">
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
                {value === "all" ? "All files" : severityStyles[value].label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="grid min-h-[300px] place-items-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-300 border-r-transparent" />
                <p className="text-sm text-slate-400">Loading file severity map...</p>
              </div>
            </div>
          )}

          {!loading && filteredData.length > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-8">
              {filteredData.map((item, index) => {
                const style = severityStyles[item.severity];
                return (
                  <motion.div
                    key={item.filePath}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(index * 0.015, 0.35) }}
                    className={`group relative aspect-square min-h-[76px] rounded-2xl ${style.cell} p-3 shadow-lg shadow-black/20 transition`}
                    title={`${item.filePath} - ${style.label} severity, ${item.occurrences} finding(s)`}
                  >
                    <div className="flex h-full flex-col justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                        {style.label}
                      </span>
                      <div>
                        <p className="truncate text-xs font-semibold text-white">
                          {getFileName(item.filePath)}
                        </p>
                        <p className="mt-1 text-[11px] text-white/70">
                          {item.occurrences} finding{item.occurrences !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="pointer-events-none absolute inset-x-2 -bottom-2 z-10 hidden rounded-xl border border-white/10 bg-slate-950/95 p-3 text-xs text-slate-200 shadow-2xl group-hover:block">
                      <p className="font-mono text-[11px] text-cyan-100">{item.filePath}</p>
                      <p className="mt-2 text-slate-400">
                        Max risk {item.maxRisk} | Avg risk {item.avgRisk}
                      </p>
                      {item.topFinding?.title && (
                        <p className="mt-1 text-slate-300">{item.topFinding.title}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {!loading && filteredData.length === 0 && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-10 text-center">
              <p className="font-medium text-slate-200">
                {heatmapData.length ? "No files found for this severity." : "No risk data available."}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {heatmapData.length
                  ? "Try another severity filter."
                  : "Run AI reviews on the connected repository to populate the map."}
              </p>
            </div>
          )}
        </div>
      </motion.section>

      {!loading && heatmapData.length > 0 && (
        <motion.section variants={itemVariants} className="grid gap-4 md:grid-cols-5">
          {[
            { label: "Files", value: stats.total, severity: "low" },
            { label: "Critical", value: stats.critical, severity: "critical" },
            { label: "High", value: stats.high, severity: "high" },
            { label: "Medium", value: stats.medium, severity: "medium" },
            { label: "Low", value: stats.low, severity: "low" },
          ].map((stat) => {
            const style = severityStyles[stat.severity];
            return (
              <div
                key={stat.label}
                className={`rounded-2xl border ${style.border} ${style.panel} p-4`}
              >
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className={`mt-2 text-3xl font-semibold ${style.text}`}>{stat.value}</p>
              </div>
            );
          })}
        </motion.section>
      )}

      {!loading && topHotspots.length > 0 && (
        <motion.section variants={itemVariants} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white">Top file hotspots</h2>
            <p className="text-sm text-slate-500">Files sorted by severity, max risk, and finding frequency.</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {topHotspots.map((item) => {
              const style = severityStyles[item.severity];
              return (
                <div key={item.filePath} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="break-all font-mono text-sm text-slate-100">{item.filePath}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {item.occurrences} finding{item.occurrences !== 1 ? "s" : ""} | max risk {item.maxRisk}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${style.panel} ${style.text} border ${style.border}`}>
                      {style.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
