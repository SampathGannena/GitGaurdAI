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

export default function RiskHeatmap({ apiBase, apiFetch, owner, repo }) {
  const [heatmapData, setHeatmapData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!owner || !repo) return

    async function loadHeatmap() {
      setLoading(true)
      try {
        const res = await apiFetch(`${apiBase}/settings/${owner}/${repo}/history?limit=50`)
        const data = await res.json()

        if (data.ok && data.history) {
          const fileRisks = {}
          data.history.forEach((run) => {
            run.findings?.forEach((f) => {
              if (!fileRisks[f.filePath]) fileRisks[f.filePath] = []
              fileRisks[f.filePath].push(f.riskScore)
            })
          })

          const result = Object.entries(fileRisks).map(([path, scores]) => ({
            filePath: path,
            avgRisk: Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)),
            occurrences: scores.length,
            maxRisk: Math.max(...scores),
          }))

          setHeatmapData(result.sort((a, b) => b.avgRisk - a.avgRisk))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadHeatmap()
  }, [apiBase, owner, repo])

  const getRiskLevel = (score) => {
    if (score >= 80) return { label: 'Critical', color: 'brand-danger' }
    if (score >= 60) return { label: 'High', color: 'brand-warning' }
    if (score >= 40) return { label: 'Medium', color: 'brand-accent' }
    if (score >= 20) return { label: 'Low', color: 'brand-secondary' }
    return { label: 'Minimal', color: 'brand-success' }
  }

  const getRiskGradient = (score) => {
    if (score >= 80) return 'from-brand-danger/30 to-brand-danger/10'
    if (score >= 60) return 'from-brand-warning/30 to-brand-warning/10'
    if (score >= 40) return 'from-brand-accent/30 to-brand-accent/10'
    if (score >= 20) return 'from-brand-secondary/30 to-brand-secondary/10'
    return 'from-brand-success/30 to-brand-success/10'
  }

  const filteredData = heatmapData.filter(item => {
    if (filter === 'all') return true
    const level = getRiskLevel(item.avgRisk).label.toLowerCase()
    return level === filter.toLowerCase()
  })

  const stats = {
    total: heatmapData.length,
    critical: heatmapData.filter(d => d.avgRisk >= 80).length,
    high: heatmapData.filter(d => d.avgRisk >= 60 && d.avgRisk < 80).length,
    medium: heatmapData.filter(d => d.avgRisk >= 40 && d.avgRisk < 60).length,
    low: heatmapData.filter(d => d.avgRisk < 40).length,
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-8"
    >
      <motion.div variants={itemVariants} className="space-y-2">
        <h1 className="section-title">🔥 Risk Heatmap</h1>
        <p className="text-dark-400">Identify high-risk code files and patterns across your repository</p>
      </motion.div>

      {!loading && heatmapData.length > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Files', value: stats.total, icon: '📁', color: 'brand-primary' },
            { label: 'Critical', value: stats.critical, icon: '🚨', color: 'brand-danger' },
            { label: 'High', value: stats.high, icon: '⚠️', color: 'brand-warning' },
            { label: 'Medium', value: stats.medium, icon: '⚡', color: 'brand-accent' },
            { label: 'Low/Minimal', value: stats.low, icon: '✓', color: 'brand-success' },
          ].map((stat, idx) => (
            <div key={idx} className={`card-hover bg-gradient-to-br ${getRiskGradient(stat.value * 10 || 10)}`}>
              <p className="text-sm text-dark-400 mb-2">{stat.label}</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-dark-100">{stat.value}</p>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {!loading && heatmapData.length > 0 && (
        <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
          {['all', 'critical', 'high', 'medium', 'low', 'minimal'].map((f) => (
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
      )}

      {loading && (
        <motion.div variants={itemVariants} className="card text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-dark-400">Loading risk analysis...</p>
        </motion.div>
      )}

      {!loading && filteredData.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-3">
          {filteredData.map((item, idx) => {
            const riskLevel = getRiskLevel(item.avgRisk)
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="card-hover"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-mono text-sm text-dark-200 break-all">{item.filePath}</p>
                    <p className="text-xs text-dark-500 mt-1">{item.occurrences} finding{item.occurrences !== 1 ? 's' : ''}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-lg font-bold text-${riskLevel.color}`}>{item.avgRisk}</p>
                      <p className="text-xs text-dark-500">Avg Risk</p>
                    </div>

                    <div className="w-32 h-2 bg-dark-800 rounded-full overflow-hidden border border-dark-700">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.avgRisk}%` }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className={`h-full bg-gradient-to-r ${getRiskGradient(item.avgRisk)}`}
                      />
                    </div>

                    <span className={`badge px-3 py-1 font-semibold whitespace-nowrap`}>
                      {riskLevel.label}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {!loading && filteredData.length === 0 && heatmapData.length === 0 && (
        <motion.div variants={itemVariants} className="card text-center py-12">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-dark-300 font-medium">No risk data available</p>
          <p className="text-dark-500 text-sm mt-1">Configure a repository and run reviews to see the heatmap</p>
        </motion.div>
      )}

      {!loading && filteredData.length === 0 && heatmapData.length > 0 && (
        <motion.div variants={itemVariants} className="card text-center py-12">
          <div className="text-3xl mb-3">🔍</div>
          <p className="text-dark-300 font-medium">No files found for this risk level</p>
          <p className="text-dark-500 text-sm mt-1">Try adjusting your filter</p>
        </motion.div>
      )}
    </motion.div>
  )
}
