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

export default function FindingHistory({ apiBase, apiFetch, owner, repo }) {
  const [findings, setFindings] = useState([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState('occurrences') // 'occurrences', 'severity', 'recent'

  useEffect(() => {
    if (!owner || !repo) return

    async function loadFindings() {
      setLoading(true)
      try {
        const res = await apiFetch(`${apiBase}/settings/${owner}/${repo}/history?limit=100`)
        const data = await res.json()

        if (data.ok && data.history) {
          const fingerprints = {}
          data.history.forEach((run) => {
            run.findings?.forEach((f) => {
              if (!fingerprints[f.fingerprint]) {
                fingerprints[f.fingerprint] = {
                  ...f,
                  occurrences: 0,
                  firstSeen: run.createdAt,
                  lastSeen: run.createdAt,
                }
              }
              fingerprints[f.fingerprint].occurrences += 1
              fingerprints[f.fingerprint].lastSeen = run.createdAt
            })
          })

          setFindings(Object.values(fingerprints).sort((a, b) => b.occurrences - a.occurrences))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadFindings()
  }, [apiBase, owner, repo])

  const formatDate = (date) => new Date(date).toLocaleDateString()
  const formatDateFull = (date) => new Date(date).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'critical':
        return { badge: 'badge-danger', color: 'text-brand-danger', icon: '🚨' }
      case 'high':
        return { badge: 'badge-warning', color: 'text-brand-warning', icon: '⚠️' }
      case 'medium':
        return { badge: 'badge-warning', color: 'text-brand-accent', icon: '⚡' }
      case 'low':
        return { badge: 'badge-info', color: 'text-brand-secondary', icon: 'ℹ️' }
      default:
        return { badge: 'badge-info', color: 'text-dark-400', icon: '●' }
    }
  }

  const getSortedFindings = () => {
    const sorted = [...findings]
    if (sortBy === 'severity') {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return sorted.sort((a, b) => (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99))
    } else if (sortBy === 'recent') {
      return sorted.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))
    }
    return sorted
  }

  const sortedFindings = getSortedFindings()
  const totalIssues = findings.reduce((acc, f) => acc + f.occurrences, 0)
  const criticalCount = findings.filter(f => f.severity === 'critical').length

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-2">
        <h1 className="section-title">🔄 Finding Deduplication & History</h1>
        <p className="text-dark-400">Track repeated issues across your pull request reviews</p>
      </motion.div>

      {/* Summary Stats */}
      {!loading && findings.length > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Unique Issues', value: findings.length, icon: '📌', color: 'brand-primary' },
            { label: 'Total Occurrences', value: totalIssues, icon: '📊', color: 'brand-secondary' },
            { label: 'Critical Issues', value: criticalCount, icon: '🚨', color: 'brand-danger' },
          ].map((stat, idx) => (
            <div key={idx} className="card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-dark-100 mt-2">{stat.value}</p>
                </div>
                <span className="text-4xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Sort Controls */}
      {!loading && findings.length > 0 && (
        <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
          {[
            { value: 'occurrences', label: 'Most Repeated' },
            { value: 'severity', label: 'By Severity' },
            { value: 'recent', label: 'Most Recent' },
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
          <p className="text-dark-400">Loading finding history...</p>
        </motion.div>
      )}

      {/* Findings List */}
      {!loading && sortedFindings.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-3">
          {sortedFindings.map((item, idx) => {
            const severity = getSeverityStyle(item.severity)
            const daysSinceLast = Math.floor((Date.now() - new Date(item.lastSeen)) / (1000 * 60 * 60 * 24))
            return (
              <motion.div
                key={item.fingerprint}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="card-hover"
              >
                <div className="grid grid-cols-1 gap-4">
                  {/* Top Section - Issue Info */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-dark-100 mb-1">{item.title}</h3>
                      <p className="text-xs text-dark-400">{item.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-mono text-xs text-dark-500">{item.filePath}</span>
                      </div>
                    </div>
                    <span className={`${severity.badge} text-sm font-semibold flex items-center gap-1 whitespace-nowrap`}>
                      {severity.icon} {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
                    </span>
                  </div>

                  {/* Bottom Section - Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-dark-700">
                    <div className="text-center">
                      <p className="text-xs text-dark-500">Occurrences</p>
                      <p className="text-lg font-bold text-brand-primary mt-1">{item.occurrences}x</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-dark-500">Category</p>
                      <p className="text-sm font-semibold text-dark-100 mt-1">{item.category || 'General'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-dark-500">Risk Score</p>
                      <p className={`text-lg font-bold mt-1 ${item.riskScore >= 80 ? 'text-brand-danger' : item.riskScore >= 60 ? 'text-brand-warning' : 'text-brand-secondary'}`}>
                        {item.riskScore || 'N/A'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-dark-500">First Seen</p>
                      <p className="text-xs font-semibold text-dark-200 mt-1">{formatDate(item.firstSeen)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-dark-500">Last Seen</p>
                      <p className="text-xs font-semibold text-dark-200 mt-1">
                        {daysSinceLast === 0 ? 'Today' : daysSinceLast === 1 ? 'Yesterday' : `${daysSinceLast}d ago`}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && findings.length === 0 && (
        <motion.div variants={itemVariants} className="card text-center py-12">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-dark-300 font-medium">No finding history yet</p>
          <p className="text-dark-500 text-sm mt-1">Run reviews on your repository to start tracking repeated findings</p>
        </motion.div>
      )}
    </motion.div>
  )
}
