import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export default function TeamAnalytics({ apiBase, apiFetch, owner, repo }) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState('findings')

  useEffect(() => {
    if (!owner || !repo) return

    async function loadAnalytics() {
      setLoading(true)
      try {
        const res = await apiFetch(`${apiBase}/settings/${owner}/${repo}/history?limit=100`)
        const data = await res.json()

        if (data.ok && data.history) {
          const authorStats = {}
          data.history.forEach((run) => {
            const author = run.prAuthor || 'unknown'
            if (!authorStats[author]) {
              authorStats[author] = { prs: 0, findings: 0, severity: { critical: 0, high: 0, medium: 0, low: 0 } }
            }
            authorStats[author].prs += 1
            run.findings?.forEach((f) => {
              authorStats[author].findings += 1
              authorStats[author].severity[f.severity] = (authorStats[author].severity[f.severity] || 0) + 1
            })
          })

          setAnalytics(
            Object.entries(authorStats)
              .map(([author, stats]) => ({
                author,
                ...stats,
                issuesPerPR: Number((stats.findings / stats.prs).toFixed(2)),
              }))
              .sort((a, b) => b.findings - a.findings)
          )
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [apiBase, owner, repo])

  const getSortedAnalytics = () => {
    if (!analytics) return []
    const sorted = [...analytics]
    if (sortBy === 'prs') {
      return sorted.sort((a, b) => b.prs - a.prs)
    } else if (sortBy === 'quality') {
      return sorted.sort((a, b) => a.issuesPerPR - b.issuesPerPR)
    } else if (sortBy === 'critical') {
      return sorted.sort((a, b) => b.severity.critical - a.severity.critical)
    }
    return sorted
  }

  const getQualityScore = (issuesPerPR) => {
    if (issuesPerPR < 0.5) return { label: 'Excellent', color: 'brand-success' }
    if (issuesPerPR < 1) return { label: 'Good', color: 'brand-secondary' }
    if (issuesPerPR < 2) return { label: 'Average', color: 'brand-accent' }
    return { label: 'Needs Improvement', color: 'brand-danger' }
  }

  const sortedAnalytics = getSortedAnalytics()

  const overallStats = analytics ? {
    totalAuthors: analytics.length,
    totalPRs: analytics.reduce((acc, a) => acc + a.prs, 0),
    totalFindings: analytics.reduce((acc, a) => acc + a.findings, 0),
    avgIssuesPerPR: (analytics.reduce((acc, a) => acc + a.issuesPerPR, 0) / analytics.length).toFixed(2),
  } : null

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-2">
        <h1 className="section-title">📊 Team Analytics & Performance</h1>
        <p className="text-dark-400">Track code quality metrics by team member and identify improvement areas</p>
      </motion.div>

      {/* Overall Stats */}
      {!loading && analytics && analytics.length > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Team Members', value: overallStats.totalAuthors, icon: '👥', color: 'brand-primary' },
            { label: 'Total PRs', value: overallStats.totalPRs, icon: '📝', color: 'brand-secondary' },
            { label: 'Total Issues', value: overallStats.totalFindings, icon: '🔍', color: 'brand-accent' },
            { label: 'Avg Issues/PR', value: overallStats.avgIssuesPerPR, icon: '📈', color: 'brand-warning' },
          ].map((stat, idx) => (
            <div key={idx} className="card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-dark-100 mt-2">{stat.value}</p>
                </div>
                <span className="text-3xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Sort Controls */}
      {!loading && analytics && analytics.length > 0 && (
        <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
          {[
            { value: 'findings', label: 'Most Issues' },
            { value: 'prs', label: 'Most PRs' },
            { value: 'quality', label: 'Best Quality' },
            { value: 'critical', label: 'Critical Issues' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                sortBy === option.value
                  ? 'bg-brand-primary text-white shadow-glow-primary'
                  : 'bg-dark-800 text-dark-300 border border-dark-700 hover:border-brand-primary/50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <motion.div variants={itemVariants} className="card text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-dark-400">Analyzing team performance...</p>
        </motion.div>
      )}

      {/* Team Analytics Table */}
      {!loading && sortedAnalytics.length > 0 && (
        <motion.div variants={itemVariants} className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700 text-dark-400 text-xs font-semibold uppercase tracking-wide">
                  <th className="py-4 px-4 text-left">Team Member</th>
                  <th className="py-4 px-4 text-center">PRs</th>
                  <th className="py-4 px-4 text-center">Total Issues</th>
                  <th className="py-4 px-4 text-center">Issues/PR</th>
                  <th className="py-4 px-4 text-center">Quality</th>
                  <th className="py-4 px-4 text-center">🚨 Critical</th>
                  <th className="py-4 px-4 text-center">⚠️ High</th>
                  <th className="py-4 px-4 text-center">⚡ Medium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {sortedAnalytics.map((author, idx) => {
                  const quality = getQualityScore(author.issuesPerPR)
                  return (
                    <motion.tr
                      key={author.author}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-dark-100">{author.author}</p>
                          <p className="text-xs text-dark-500">Contributor</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-primary/20 text-brand-primary font-bold">
                          {author.prs}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-accent/20 text-brand-accent font-bold">
                          {author.findings}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <p className="font-semibold text-dark-100">{author.issuesPerPR}</p>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${quality.color}/20 text-${quality.color}`}>
                          {quality.label}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {author.severity.critical > 0 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-danger/20 text-brand-danger font-bold">
                            {author.severity.critical}
                          </span>
                        ) : (
                          <span className="text-dark-500">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {author.severity.high > 0 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-warning/20 text-brand-warning font-bold">
                            {author.severity.high}
                          </span>
                        ) : (
                          <span className="text-dark-500">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {author.severity.medium > 0 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-accent/20 text-brand-accent font-bold">
                            {author.severity.medium}
                          </span>
                        ) : (
                          <span className="text-dark-500">—</span>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Insight Card */}
      {!loading && analytics && analytics.length > 0 && (
        <motion.div variants={itemVariants} className="card bg-gradient-to-br from-brand-secondary/20 to-brand-secondary/5 border border-brand-secondary/30">
          <div className="flex items-start gap-4">
            <span className="text-3xl">💡</span>
            <div>
              <h3 className="font-bold text-dark-100 mb-1">Team Insights</h3>
              <p className="text-sm text-dark-400">
                Your team averages <span className="font-semibold text-dark-100">{overallStats.avgIssuesPerPR} issues per PR</span>. 
                Consider pair-programming sessions or training for team members with higher issue rates to improve overall code quality.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && (!analytics || analytics.length === 0) && (
        <motion.div variants={itemVariants} className="card text-center py-12">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-dark-300 font-medium">No team data available yet</p>
          <p className="text-dark-500 text-sm mt-1">Run reviews on pull requests to see team performance analytics</p>
        </motion.div>
      )}
    </motion.div>
  )
}
