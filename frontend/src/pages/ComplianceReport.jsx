import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export default function ComplianceReport({ apiBase, apiFetch, owner, repo }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!owner || !repo) return

    async function generateReport() {
      setLoading(true)
      try {
        const [histRes, insightsRes] = await Promise.all([
          apiFetch(`${apiBase}/settings/${owner}/${repo}/history?limit=100`),
          apiFetch(`${apiBase}/settings/${owner}/${repo}/insights`),
        ])
        const histData = await histRes.json()
        const insData = await insightsRes.json()

        if (histData.ok && insData.ok) {
          const history = histData.history || []
          const insights = insData.insights || {}

          const criticalCount = history.reduce((acc, run) => acc + (run.findings?.filter(f => f.severity === 'critical').length || 0), 0)
          const securityCount = history.reduce((acc, run) => acc + (run.findings?.filter(f => f.category === 'security').length || 0), 0)
          const totalReviews = insights.completedRuns || 0
          const avgTimeMs = insights.avgTotalMs || 0
          const completionRate = insights.completedRuns && insights.totalRuns ? ((insights.completedRuns / insights.totalRuns) * 100).toFixed(1) : 0

          setReport({
            generatedAt: new Date().toISOString(),
            repository: `${owner}/${repo}`,
            totalReviewsCompleted: totalReviews,
            criticalIssuesFound: criticalCount,
            securityIssuesFound: securityCount,
            avgProcessingTimeMs: avgTimeMs,
            completionRate: completionRate,
            complianceStatus: criticalCount === 0 ? 'passing' : 'review_required',
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    generateReport()
  }, [apiBase, owner, repo])

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-2">
        <h1 className="section-title">📋 Compliance Report</h1>
        <p className="text-dark-400">Audit-ready summary of code quality and security reviews</p>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <motion.div variants={itemVariants} className="card text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-dark-400">Generating compliance report...</p>
        </motion.div>
      )}

      {/* Report Content */}
      {!loading && report && (
        <>
          {/* Compliance Status Card */}
          <motion.div
            variants={itemVariants}
            className={`card bg-gradient-to-br ${
              report.complianceStatus === 'passing'
                ? 'from-brand-success/20 to-brand-success/5 border border-brand-success/30'
                : 'from-brand-warning/20 to-brand-warning/5 border border-brand-warning/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400 mb-2">Compliance Status</p>
                <h2 className="text-3xl font-bold text-dark-100 mb-2">
                  {report.complianceStatus === 'passing' ? '✓ PASSING' : '⚠ REVIEW REQUIRED'}
                </h2>
                <p className="text-dark-400">
                  {report.complianceStatus === 'passing'
                    ? 'Your repository meets the quality baseline and is ready for deployment.'
                    : 'Critical findings detected. Please review and remediate before next release.'}
                </p>
              </div>
              <span className="text-6xl">
                {report.complianceStatus === 'passing' ? '✓' : '⚠'}
              </span>
            </div>
          </motion.div>

          {/* Key Metrics */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Reviews', value: report.totalReviewsCompleted, icon: '📊', color: 'brand-primary' },
              { label: 'Completion Rate', value: `${report.completionRate}%`, icon: '✓', color: 'brand-success' },
              { label: 'Critical Issues', value: report.criticalIssuesFound, icon: '🚨', color: 'brand-danger' },
              { label: 'Security Issues', value: report.securityIssuesFound, icon: '🔒', color: 'brand-accent' },
            ].map((metric, idx) => (
              <div key={idx} className="card-hover">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{metric.icon}</span>
                </div>
                <p className="text-sm text-dark-400">{metric.label}</p>
                <p className="text-3xl font-bold text-dark-100 mt-2">{metric.value}</p>
              </div>
            ))}
          </motion.div>

          {/* Performance Metrics */}
          <motion.div variants={itemVariants} className="card">
            <h3 className="subsection-title">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <p className="text-sm text-dark-400 mb-2">Average Processing Time</p>
                <p className="text-2xl font-bold text-brand-primary">{(report.avgProcessingTimeMs / 1000).toFixed(2)}s</p>
                <p className="text-xs text-dark-500 mt-1">Per pull request</p>
              </div>
              <div>
                <p className="text-sm text-dark-400 mb-2">Repository</p>
                <p className="text-lg font-mono text-dark-200">{report.repository}</p>
                <p className="text-xs text-dark-500 mt-1">Monitored repository</p>
              </div>
              <div>
                <p className="text-sm text-dark-400 mb-2">Report Generated</p>
                <p className="text-dark-200 text-sm">{new Date(report.generatedAt).toLocaleDateString()}</p>
                <p className="text-xs text-dark-500 mt-1">{new Date(report.generatedAt).toLocaleTimeString()}</p>
              </div>
            </div>
          </motion.div>

          {/* Recommendations */}
          <motion.div variants={itemVariants} className="card bg-gradient-to-br from-brand-secondary/10 to-dark-900 border border-brand-secondary/20">
            <div className="flex gap-4">
              <span className="text-3xl">💡</span>
              <div>
                <h3 className="font-bold text-dark-100 mb-2">Recommendations</h3>
                <ul className="space-y-2 text-sm text-dark-400">
                  {report.criticalIssuesFound > 0 && (
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Address all critical issues before releasing to production</span>
                    </li>
                  )}
                  {report.securityIssuesFound > 5 && (
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Schedule security training for the team</span>
                    </li>
                  )}
                  {report.completionRate < 80 && (
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Increase review coverage and frequency</span>
                    </li>
                  )}
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Review GitGuard settings to match your quality standards</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Report Footer */}
          <motion.div variants={itemVariants} className="card text-center border border-dark-700">
            <p className="text-xs text-dark-500">Report generated by GitGuard AI</p>
            <p className="text-xs text-dark-600 mt-1 font-mono">{new Date(report.generatedAt).toISOString()}</p>
          </motion.div>
        </>
      )}

      {/* No Data State */}
      {!loading && !report && (
        <motion.div variants={itemVariants} className="card text-center py-12">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-dark-300 font-medium">No compliance data available</p>
          <p className="text-dark-500 text-sm mt-1">Configure a repository and run reviews to generate a compliance report</p>
        </motion.div>
      )}
    </motion.div>
  )
}
