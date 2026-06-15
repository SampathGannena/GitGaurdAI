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

const severityStyles = {
  critical: "border-rose-300/30 bg-rose-300/10 text-rose-100",
  high: "border-orange-300/30 bg-orange-300/10 text-orange-100",
  medium: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  low: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
};

function formatMs(ms) {
  const value = Number(ms || 0);
  if (!value) return "0.00s";
  return `${(value / 1000).toFixed(2)}s`;
}

function formatDate(value) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPosture(report) {
  if (!report) return null;
  if (report.criticalIssuesFound > 0) {
    return {
      label: "Review required",
      tone: "border-amber-300/30 bg-amber-300/10 text-amber-100",
      copy: "Critical findings exist. Remediate or document an exception before release.",
      score: Math.max(35, Math.round(report.completionRate) - report.criticalIssuesFound * 8),
    };
  }
  if (report.completionRate < 80) {
    return {
      label: "Coverage gap",
      tone: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
      copy: "No critical findings, but review coverage is below the recommended operating bar.",
      score: Math.round(report.completionRate),
    };
  }
  return {
    label: "Audit ready",
    tone: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
    copy: "Review coverage and critical-finding posture are within the release baseline.",
    score: Math.min(100, Math.round(report.completionRate) + 5),
  };
}

export default function ComplianceReport({ apiBase, apiFetch, owner, repo }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!owner || !repo) return;

    let isActive = true;
    async function generateReport() {
      setLoading(true);
      try {
        const [histRes, insightsRes] = await Promise.all([
          apiFetch(`${apiBase}/settings/${owner}/${repo}/history?limit=100`),
          apiFetch(`${apiBase}/settings/${owner}/${repo}/insights`),
        ]);
        const histData = await histRes.json();
        const insData = await insightsRes.json();

        if (histData.ok && insData.ok && isActive) {
          const history = histData.history || [];
          const insights = insData.insights || {};
          const findings = history.flatMap((run) =>
            (run.findings || []).map((finding) => ({
              ...finding,
              prNumber: run.prNumber,
              prTitle: run.prTitle,
              runStatus: run.status,
              detectedAt: run.updatedAt || run.createdAt,
            })),
          );

          const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
          findings.forEach((finding) => {
            const severity = String(finding.severity || "low").toLowerCase();
            bySeverity[severity] = (bySeverity[severity] || 0) + 1;
          });

          const securityCount = findings.filter((finding) => finding.category === "security").length;
          const completionRate = insights.completedRuns && insights.totalRuns
            ? Number(((insights.completedRuns / insights.totalRuns) * 100).toFixed(1))
            : 0;
          const failedRuns = insights.failedRuns || history.filter((run) => run.status === "failed").length;
          const skippedRuns = insights.skippedRuns || history.filter((run) => run.status === "skipped").length;

          setReport({
            generatedAt: new Date().toISOString(),
            repository: `${owner}/${repo}`,
            totalRuns: insights.totalRuns || history.length,
            totalReviewsCompleted: insights.completedRuns || 0,
            failedRuns,
            skippedRuns,
            criticalIssuesFound: bySeverity.critical,
            highIssuesFound: bySeverity.high,
            mediumIssuesFound: bySeverity.medium,
            lowIssuesFound: bySeverity.low,
            securityIssuesFound: securityCount,
            avgProcessingTimeMs: insights.avgTotalMs || 0,
            avgRiskScore: insights.avgRiskScore || 0,
            completionRate,
            findings: findings
              .slice()
              .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
              .slice(0, 6),
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isActive) setLoading(false);
      }
    }

    generateReport();
    return () => {
      isActive = false;
    };
  }, [apiBase, apiFetch, owner, repo]);

  const posture = getPosture(report);
  const controls = useMemo(() => {
    if (!report) return [];
    return [
      {
        name: "AI review coverage",
        status: report.completionRate >= 80 ? "Operational" : "Needs coverage",
        value: `${report.completionRate}%`,
        good: report.completionRate >= 80,
      },
      {
        name: "Critical finding gate",
        status: report.criticalIssuesFound === 0 ? "Clear" : "Blocking",
        value: String(report.criticalIssuesFound),
        good: report.criticalIssuesFound === 0,
      },
      {
        name: "Security review signal",
        status: report.securityIssuesFound > 0 ? "Evidence captured" : "No issues logged",
        value: String(report.securityIssuesFound),
        good: true,
      },
      {
        name: "Pipeline reliability",
        status: report.failedRuns === 0 ? "Stable" : "Failures present",
        value: `${report.failedRuns} failed`,
        good: report.failedRuns === 0,
      },
    ];
  }, [report]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 pb-8"
    >
      <motion.section
        variants={itemVariants}
        className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 p-6 shadow-2xl md:p-8"
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-emerald-200/70">
              Audit dossier
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              Compliance Report
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-400">
              Release-readiness evidence for review coverage, security posture, and remediation risk.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Repository</p>
            <p className="mt-2 max-w-md break-all font-mono text-sm text-slate-200">
              {owner && repo ? `${owner}/${repo}` : "No repository connected"}
            </p>
          </div>
        </div>
      </motion.section>

      {loading && (
        <motion.div variants={itemVariants} className="rounded-3xl border border-white/10 bg-white/[0.04] py-12 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-300 border-r-transparent" />
          <p className="text-slate-400">Generating compliance report...</p>
        </motion.div>
      )}

      {!loading && report && posture && (
        <>
          <motion.section variants={itemVariants} className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className={`rounded-3xl border p-6 ${posture.tone}`}>
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm opacity-80">Compliance posture</p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">{posture.label}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{posture.copy}</p>
                </div>
                <div className="grid h-28 w-28 shrink-0 place-items-center rounded-full border border-white/15 bg-black/20">
                  <div className="text-center">
                    <p className="text-3xl font-semibold text-white">{posture.score}</p>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Score</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-black/25">
                <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, posture.score)}%` }} />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Report metadata
              </p>
              <div className="mt-5 grid gap-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-400">Generated</span>
                  <span className="text-right text-sm text-slate-200">{formatDate(report.generatedAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-400">Avg processing</span>
                  <span className="font-mono text-sm text-cyan-200">{formatMs(report.avgProcessingTimeMs)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-400">Avg risk score</span>
                  <span className="font-mono text-sm text-amber-200">{report.avgRiskScore}</span>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Reviews completed", value: report.totalReviewsCompleted, hint: `${report.totalRuns} total runs` },
              { label: "Completion rate", value: `${report.completionRate}%`, hint: `${report.failedRuns} failed, ${report.skippedRuns} skipped` },
              { label: "Critical findings", value: report.criticalIssuesFound, hint: "Release blockers" },
              { label: "Security findings", value: report.securityIssuesFound, hint: "Security category evidence" },
            ].map((metric) => (
              <div key={metric.label} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-slate-500">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
                <p className="mt-2 text-xs text-slate-500">{metric.hint}</p>
              </div>
            ))}
          </motion.section>

          <motion.section variants={itemVariants} className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white">Control coverage</h2>
                <p className="mt-1 text-sm text-slate-500">Operational checks inferred from recent review runs.</p>
              </div>
              <div className="space-y-3">
                {controls.map((control) => (
                  <div key={control.name} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-100">{control.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{control.status}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        control.good
                          ? "border border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                          : "border border-amber-300/25 bg-amber-300/10 text-amber-100"
                      }`}>
                        {control.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white">Risk ledger</h2>
                <p className="mt-1 text-sm text-slate-500">Highest risk findings currently present in the audit sample.</p>
              </div>
              {report.findings.length > 0 ? (
                <div className="space-y-3">
                  {report.findings.map((finding, index) => {
                    const severity = String(finding.severity || "low").toLowerCase();
                    return (
                      <div key={`${finding.filePath}-${finding.title}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-white">{finding.title || "Review finding"}</p>
                            <p className="mt-1 break-all font-mono text-xs text-slate-500">{finding.filePath}</p>
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityStyles[severity] || severityStyles.low}`}>
                            {severity}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                          <span>PR #{finding.prNumber}</span>
                          <span>Risk {finding.riskScore || 0}</span>
                          <span>{formatDate(finding.detectedAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-10 text-center">
                  <p className="font-medium text-emerald-100">No findings in the current audit sample.</p>
                  <p className="mt-1 text-sm text-slate-500">Continue scanning PRs to keep evidence fresh.</p>
                </div>
              )}
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
            <h2 className="text-xl font-semibold text-white">Recommendations</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                report.criticalIssuesFound > 0
                  ? "Resolve all critical findings or document a formal release exception."
                  : "Keep the critical-finding gate enabled for release branches.",
                report.securityIssuesFound > 5
                  ? "Review recurring security categories and update team review standards."
                  : "Maintain security-first review coverage for sensitive modules.",
                report.completionRate < 80
                  ? "Increase scan coverage so at least 80% of recent review runs complete successfully."
                  : "Archive this report with release evidence for traceability.",
                "Review GitGuard settings when repository risk profile or ownership changes.",
              ].map((recommendation) => (
                <div key={recommendation} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-300">
                  {recommendation}
                </div>
              ))}
            </div>
          </motion.section>
        </>
      )}

      {!loading && !report && (
        <motion.div variants={itemVariants} className="rounded-3xl border border-white/10 bg-white/[0.04] py-12 text-center">
          <p className="font-medium text-slate-300">No compliance data available</p>
          <p className="mt-1 text-sm text-slate-500">Connect a repository and run reviews to generate an audit dossier.</p>
        </motion.div>
      )}
    </motion.div>
  );
}
