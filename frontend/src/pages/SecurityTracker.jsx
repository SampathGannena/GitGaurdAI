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

export default function SecurityTracker({ apiBase, apiFetch, owner, repo }) {
  const [securityFindings, setSecurityFindings] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!owner || !repo) return

    async function loadSecurity() {
      setLoading(true)
      try {
        const res = await apiFetch(`${apiBase}/settings/${owner}/${repo}/history?limit=100`)
        const data = await res.json()

        if (data.ok && data.history) {
          const securityIssues = []
          data.history.forEach((run) => {
            run.findings?.forEach((f) => {
              if (f.category === 'security') {
                securityIssues.push({
                  ...f,
                  prNumber: run.prNumber,
                  timestamp: run.createdAt,
                  prTitle: run.prTitle,
                })
              }
            })
          })

          setSecurityFindings(securityIssues.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadSecurity()
  }, [apiBase, owner, repo])

  const formatDate = (date) => new Date(date).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const getSeverityStyle = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return { badge: 'badge-danger', color: 'from-brand-danger/30', icon: '🚨' }
      case 'high':
        return { badge: 'badge-warning', color: 'from-brand-warning/30', icon: '⚠️' }
      case 'medium':
        return { badge: 'badge-warning', color: 'from-brand-accent/30', icon: '⚡' }
      case 'low':
        return { badge: 'badge-info', color: 'from-brand-secondary/30', icon: 'ℹ️' }
      default:
        return { badge: 'badge-info', color: 'from-dark-800', icon: '●' }
    }
  }

  const filteredFindings = securityFindings.filter(item => {
    if (filter === 'all') return true
    return item.severity?.toLowerCase() === filter.toLowerCase()
  })

  const stats = {
    total: securityFindings.length,
    critical: securityFindings.filter(f => f.severity?.toLowerCase() === 'critical').length,
    high: securityFindings.filter(f => f.severity?.toLowerCase() === 'high').length,
    medium: securityFindings.filter(f => f.severity?.toLowerCase() === 'medium').length,
    low: securityFindings.filter(f => f.severity?.toLowerCase() === 'low').length,
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-2">
        <h1 className="section-title">🔒 Security Vulnerability Tracker</h1>
        <p className="text-dark-400">Monitor and track all detected security vulnerabilities in your codebase</p>
      </motion.div>

      {/* Summary Stats */}
      {!loading && securityFindings.length === 0 ? (
        <motion.div variants={itemVariants} className="card bg-gradient-to-br from-brand-success/20 to-brand-success/5 border border-brand-success/30 text-center py-12">
          <div className="text-5xl mb-3">✓</div>
          <p className="text-brand-success font-bold text-lg">No Security Vulnerabilities Detected!</p>
          <p className="text-dark-400 text-sm mt-2">Your repository is secure.</p>
        </motion.div>
      ) : (
        <>
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Issues', value: stats.total, icon: '🔍', color: 'brand-primary' },
              { label: 'Critical', value: stats.critical, icon: '🚨', color: 'brand-danger' },
              { label: 'High', value: stats.high, icon: '⚠️', color: 'brand-warning' },
              { label: 'Medium', value: stats.medium, icon: '⚡', color: 'brand-accent' },
              { label: 'Low', value: stats.low, icon: 'ℹ️', color: 'brand-secondary' },
            ].map((stat, idx) => (
              <div key={idx} className={`card-hover bg-gradient-to-br ${getSeverityStyle(stat.label.toLowerCase()).color} to-transparent`}>
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

          {/* Filter Buttons */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
            {['all', 'critical', 'high', 'medium', 'low'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  filter === f
                    ? 'bg-brand-primary text-white shadow-glow-primary'
                    : 'bg-dark-800 text-dark-300 border border-dark-700 hover:border-brand-primary/50'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </motion.div>
        </>
      )}

      {/* Loading State */}
      {loading && (
        <motion.div variants={itemVariants} className="card text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-dark-400">Scanning for security vulnerabilities...</p>
        </motion.div>
      )}

      {/* Security Issues List */}
      {!loading && filteredFindings.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-4">
          {filteredFindings.map((item, idx) => {
            const severity = getSeverityStyle(item.severity)
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`card-hover bg-gradient-to-br ${severity.color} to-transparent border-l-4 border-l-brand-danger`}
              >
                <div className="space-y-4">
                  {/* Header Section */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{severity.icon}</span>
                        <h3 className="font-bold text-dark-100 text-lg">{item.title}</h3>
                      </div>
                      <p className="text-dark-400 text-sm">{item.description}</p>
                    </div>
                    <span className={`${severity.badge} text-sm font-semibold whitespace-nowrap px-4 py-2`}>
                      {item.severity?.toUpperCase()}
                    </span>
                  </div>

                  {/* Details Section */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-dark-800/50 rounded-lg text-sm">
                    <div>
                      <p className="text-dark-500">File</p>
                      <p className="text-dark-200 font-mono text-xs mt-1 truncate">{item.filePath}</p>
                    </div>
                    <div>
                      <p className="text-dark-500">PR #</p>
                      <p className="text-dark-200 font-semibold mt-1">#{item.prNumber}</p>
                    </div>
                    <div>
                      <p className="text-dark-500">Risk Score</p>
                      <p className={`font-bold mt-1 ${item.riskScore >= 80 ? 'text-brand-danger' : item.riskScore >= 60 ? 'text-brand-warning' : 'text-brand-secondary'}`}>
                        {item.riskScore || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-dark-500">Detected</p>
                      <p className="text-dark-200 text-xs mt-1">{formatDate(item.timestamp)}</p>
                    </div>
                  </div>

                  {/* Suggestion/Fix */}
                  {item.suggestion && (
                    <div className="bg-dark-900 rounded-lg p-4 border border-dark-700">
                      <p className="text-xs font-semibold text-dark-300 mb-2 flex items-center gap-2">
                        <span>💡</span> Suggested Fix
                      </p>
                      <div className="font-mono text-xs text-dark-300 bg-black/30 p-3 rounded overflow-x-auto max-h-24 overflow-y-auto">
                        {item.suggestion}
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  {item.explanation && (
                    <div className="border-t border-dark-700 pt-3">
                      <p className="text-xs font-semibold text-dark-300 mb-2">Why This Matters</p>
                      <p className="text-sm text-dark-400">{item.explanation}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Empty State for Filtered Results */}
      {!loading && filteredFindings.length === 0 && securityFindings.length > 0 && (
        <motion.div variants={itemVariants} className="card text-center py-12">
          <div className="text-3xl mb-3">🔍</div>
          <p className="text-dark-300 font-medium">No issues found for this severity level</p>
          <p className="text-dark-500 text-sm mt-1">Try adjusting your filter</p>
        </motion.div>
      )}
    </motion.div>
  )
}
