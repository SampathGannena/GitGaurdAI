import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function PRAnalysisPage({
  apiBase,
  apiFetch,
  owner,
  repo,
  prNumber,
  onClose,
}) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!owner || !repo || !prNumber) {
      setError("Missing repository or PR information");
      setLoading(false);
      return;
    }

    const fetchAnalysis = async () => {
      try {
        const res = await apiFetch(
          `${apiBase}/settings/${owner}/${repo}/runs/${prNumber}`,
        );
        if (!res.ok) throw new Error("Failed to fetch analysis");
        const data = await res.json();
        setAnalysis(data.analysis || data.run);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [owner, repo, prNumber]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-12"
      >
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-r-transparent mb-4" />
          <p className="text-slate-300">Loading PR analysis...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-lg bg-red-900/20 border border-red-700/50 text-red-200"
      >
        <p>⚠️ {error}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 rounded-lg bg-red-600/30 hover:bg-red-600/50 transition-all"
          >
            Close
          </button>
        )}
      </motion.div>
    );
  }

  if (!analysis) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-lg bg-slate-800/50 border border-white/10 text-slate-300"
      >
        <p>No analysis available for this PR yet</p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 transition-all"
          >
            Close
          </button>
        )}
      </motion.div>
    );
  }

  const getSeverityColor = (severity) => {
    const colors = {
      critical: "text-red-400 bg-red-900/20",
      high: "text-orange-400 bg-orange-900/20",
      medium: "text-yellow-400 bg-yellow-900/20",
      low: "text-blue-400 bg-blue-900/20",
    };
    return colors[severity] || colors.low;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      security: "🔒",
      performance: "⚡",
      correctness: "✓",
      maintainability: "📚",
    };
    return icons[category] || "📌";
  };

  const findings = analysis.findings || [];
  const status = analysis.status || "unknown";
  const timingsMs = analysis.timingsMs || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">
            PR #{analysis.prNumber}: {analysis.prTitle}
          </h1>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-all"
            >
              ✕ Close
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Author</p>
            <p className="font-semibold text-slate-100">
              {analysis.prAuthor || "Unknown"}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Status</p>
            <p
              className={`font-semibold ${status === "completed" ? "text-green-400" : "text-yellow-400"}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Findings</p>
            <p className="font-semibold text-slate-100">{findings.length}</p>
          </div>
          <div>
            <p className="text-slate-400">Avg Risk Score</p>
            <p className="font-semibold text-slate-100">
              {(analysis.avgRiskScore || 0).toFixed(1)}/100
            </p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {Object.keys(timingsMs).length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-lg bg-white/5 border border-white/10"
        >
          <h3 className="font-semibold mb-3 text-violet-300">
            ⏱️ Performance Metrics
          </h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            {timingsMs.fetchDiffMs && (
              <div>
                <p className="text-slate-400">Diff Fetch</p>
                <p className="font-semibold">{timingsMs.fetchDiffMs}ms</p>
              </div>
            )}
            {timingsMs.llmMs && (
              <div>
                <p className="text-slate-400">AI Analysis</p>
                <p className="font-semibold">{timingsMs.llmMs}ms</p>
              </div>
            )}
            {timingsMs.commentMs && (
              <div>
                <p className="text-slate-400">Comment Post</p>
                <p className="font-semibold">{timingsMs.commentMs}ms</p>
              </div>
            )}
            {timingsMs.total && (
              <div>
                <p className="text-slate-400">Total</p>
                <p className="font-semibold text-cyan-400">
                  {timingsMs.total}ms
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Findings List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          {findings.length === 0
            ? "✨ No Issues Found"
            : `🔍 ${findings.length} Finding${findings.length !== 1 ? "s" : ""}`}
        </h2>

        {findings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 rounded-lg bg-green-900/20 border border-green-700/50 text-green-200 text-center"
          >
            <p className="text-lg font-semibold">
              Great code! No issues detected. ✅
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {findings.map((finding, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                {/* Finding Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl mt-1">
                      {getCategoryIcon(finding.category)}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-100">
                        {finding.title}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
                        {finding.filename}
                        {finding.lineNumber && ` : line ${finding.lineNumber}`}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getSeverityColor(finding.severity)}`}
                  >
                    {finding.severity?.toUpperCase()}
                  </div>
                </div>

                {/* Category Badge */}
                <div className="mb-3">
                  <span className="px-2 py-1 rounded-full text-xs bg-white/10 text-slate-300">
                    {finding.category}
                  </span>
                  {finding.confidence && (
                    <span className="ml-2 text-xs text-slate-400">
                      Confidence: {(finding.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                {/* Explanation */}
                {finding.explanation && (
                  <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                    {finding.explanation}
                  </p>
                )}

                {/* Risk Score */}
                {finding.riskScore !== undefined && (
                  <div className="mb-4 p-3 rounded-lg bg-slate-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-400">
                        RISK SCORE
                      </span>
                      <span className="text-lg font-bold text-cyan-400">
                        {finding.riskScore.toFixed(1)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-violet-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, finding.riskScore)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Suggestion/Fix */}
                {finding.suggestion && (
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 font-mono text-xs text-slate-300 overflow-x-auto mb-4">
                    <p className="font-semibold text-slate-200 mb-2">
                      💡 Suggested Fix:
                    </p>
                    <pre className="whitespace-pre-wrap break-words">
                      {finding.suggestion}
                    </pre>
                  </div>
                )}

                {/* Blast Radius */}
                {finding.blastRadius && (
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-orange-900/30 text-orange-300 border border-orange-700/50">
                    🎯 Blast Radius: {finding.blastRadius}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4 border-t border-white/10">
        <a
          href={`https://github.com/${owner}/${repo}/pull/${analysis.prNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-violet-500/50 transition-all font-semibold text-center"
        >
          View on GitHub →
        </a>
        {onClose && (
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5 transition-all"
          >
            Back
          </button>
        )}
      </div>
    </motion.div>
  );
}
