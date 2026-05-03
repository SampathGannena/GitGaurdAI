import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export default function Dashboard({ apiBase, apiFetch, owner, setOwner, repo, setRepo }) {
  const [settings, setSettings] = useState({
    enabled: true,
    strictMode: false,
    ignoreLint: true,
    securityFirst: false,
    enableReplayGuard: true,
    enableRiskSummary: true,
    explanationTone: 'professional',
    maxHunksPerPR: 20,
    maxCommentsPerPR: 10,
  })
  const [history, setHistory] = useState([])
  const [insights, setInsights] = useState({})
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState('') // 'success', 'error', 'info'
  const [loading, setLoading] = useState(false)

  const loadSettings = async () => {
    if (!owner || !repo) {
      setStatus('⚠️ Please enter owner and repository name')
      setStatusType('info')
      return
    }
    setLoading(true)
    try {
      const res = await apiFetch(`${apiBase}/settings/${owner}/${repo}`)
      const data = await res.json()
      if (data.ok) {
        setSettings(data.settings || settings)
        setStatus('✓ Settings loaded successfully')
        setStatusType('success')
      } else {
        setStatus('✗ Failed to load settings')
        setStatusType('error')
      }
    } catch (err) {
      console.error(err)
      setStatus('✗ Error: ' + err.message)
      setStatusType('error')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!owner || !repo) {
      setStatus('⚠️ Please enter owner and repository name')
      setStatusType('info')
      return
    }
    setLoading(true)
    try {
      const res = await apiFetch(`${apiBase}/settings/${owner}/${repo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (data.ok) {
        setStatus('✓ Settings saved successfully')
        setStatusType('success')
      } else {
        setStatus('✗ Failed to save settings')
        setStatusType('error')
      }
    } catch (err) {
      console.error(err)
      setStatus('✗ Error: ' + err.message)
      setStatusType('error')
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    if (!owner || !repo) {
      setStatus('⚠️ Please enter owner and repository name')
      setStatusType('info')
      return
    }
    setLoading(true)
    try {
      const [histRes, insRes] = await Promise.all([
        apiFetch(`${apiBase}/settings/${owner}/${repo}/history?limit=20`),
        apiFetch(`${apiBase}/settings/${owner}/${repo}/insights`),
      ])
      const histData = await histRes.json()
      const insData = await insRes.json()

      if (histData.ok) {
        setHistory(histData.history || [])
        setInsights(insData.insights || {})
        setStatus('✓ History and insights loaded')
        setStatusType('success')
      } else {
        setStatus('✗ Failed to load history')
        setStatusType('error')
      }
    } catch (err) {
      console.error(err)
      setStatus('✗ Error: ' + err.message)
      setStatusType('error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (type) => {
    switch (type) {
      case 'success': return 'from-brand-success/20 to-brand-success/5 border-brand-success/30'
      case 'error': return 'from-brand-danger/20 to-brand-danger/5 border-brand-danger/30'
      case 'info': return 'from-brand-secondary/20 to-brand-secondary/5 border-brand-secondary/30'
      default: return 'from-dark-800 to-dark-900 border-dark-700'
    }
  }

  const getStatusIcon = (type) => {
    switch (type) {
      case 'success': return '✓'
      case 'error': return '✕'
      case 'info': return 'ℹ'
      default: return '●'
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-8"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="space-y-2">
        <h1 className="section-title">Dashboard & Configuration</h1>
        <p className="text-dark-400">Manage your GitGuard AI settings and monitor review performance</p>
      </motion.div>

      {/* Status Alert */}
      {status && (
        <motion.div
          variants={itemVariants}
          className={`card glass border-2 bg-gradient-to-r ${getStatusColor(statusType)} flex items-center gap-4`}
        >
          <div className="text-2xl">{getStatusIcon(statusType)}</div>
          <div className="flex-1">
            <p className="text-dark-100">{status}</p>
          </div>
          <button
            onClick={() => setStatus('')}
            className="text-dark-400 hover:text-dark-100 transition"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Repository Setup Section */}
      <motion.div variants={itemVariants} className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center">
            <span className="text-xl">📦</span>
          </div>
          <div>
            <h2 className="subsection-title">Repository Configuration</h2>
            <p className="text-xs text-dark-400">Connect to your GitHub repository</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-200">
              Repository Owner
            </label>
            <input
              type="text"
              placeholder="e.g., your-org"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="input-field"
            />
            <p className="text-xs text-dark-500">GitHub organization or user name</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-200">
              Repository Name
            </label>
            <input
              type="text"
              placeholder="e.g., gitguard-ai"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              className="input-field"
            />
            <p className="text-xs text-dark-500">Project repository name</p>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={loadSettings}
            disabled={loading || !owner || !repo}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : '🔄 Load Settings'}
          </button>
          <button
            onClick={saveSettings}
            disabled={loading || !owner || !repo}
            className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : '💾 Save Settings'}
          </button>
        </div>
      </motion.div>

      {/* Review Settings Section */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-brand-secondary/20 border border-brand-secondary/30 flex items-center justify-center">
              <span className="text-xl">⚙️</span>
            </div>
            <div>
              <h2 className="subsection-title">Review Analysis Settings</h2>
              <p className="text-xs text-dark-400">Control how GitGuard analyzes your code</p>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-dark-100 mt-6 mb-4">Analysis Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: 'enabled', label: 'Enable Reviews', desc: 'Activate GitGuard for this repository' },
                { key: 'strictMode', label: 'Strict Mode', desc: 'Flag all potential issues, even minor ones' },
                { key: 'securityFirst', label: 'Security First', desc: 'Prioritize security vulnerabilities' },
                { key: 'ignoreLint', label: 'Ignore Lint Issues', desc: 'Skip styling and linter warnings' },
                { key: 'enableReplayGuard', label: 'Replay Guard', desc: 'Prevent duplicate review comments' },
                { key: 'enableRiskSummary', label: 'Risk Summary', desc: 'Include overall risk assessment' },
              ].map((setting) => (
                <label
                  key={setting.key}
                  className="glass rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-all duration-300 flex items-start gap-3"
                >
                  <input
                    type="checkbox"
                    checked={settings[setting.key]}
                    onChange={(e) => setSettings({ ...settings, [setting.key]: e.target.checked })}
                    className="mt-1 w-4 h-4 cursor-pointer rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-dark-100">{setting.label}</p>
                    <p className="text-xs text-dark-400 mt-1">{setting.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Configuration Options */}
          <div className="space-y-4 mt-8">
            <h3 className="text-sm font-semibold text-dark-100 mb-4">Review Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-dark-200">
                  📝 Explanation Tone
                </label>
                <select
                  value={settings.explanationTone}
                  onChange={(e) => setSettings({ ...settings, explanationTone: e.target.value })}
                  className="input-field text-dark-100"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="technical">Technical</option>
                </select>
                <p className="text-xs text-dark-500">Communication style for AI feedback</p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-dark-200">
                  🔍 Max Code Hunks per PR
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={settings.maxHunksPerPR}
                  onChange={(e) => setSettings({ ...settings, maxHunksPerPR: parseInt(e.target.value) })}
                  className="input-field"
                />
                <p className="text-xs text-dark-500">Maximum code sections to analyze</p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-dark-200">
                  💬 Max Comments per PR
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.maxCommentsPerPR}
                  onChange={(e) => setSettings({ ...settings, maxCommentsPerPR: parseInt(e.target.value) })}
                  className="input-field"
                />
                <p className="text-xs text-dark-500">Maximum review comments per pull request</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Insights Section */}
      {Object.keys(insights).length > 0 && (
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h2 className="subsection-title">Repository Insights</h2>
              <p className="text-xs text-dark-400">Performance metrics and statistics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Reviews', value: insights.totalRuns || 0, icon: '📋', color: 'brand-secondary' },
              { label: 'Completed', value: insights.completedRuns || 0, icon: '✓', color: 'brand-success' },
              { label: 'Failed', value: insights.failedRuns || 0, icon: '✕', color: 'brand-danger' },
              { label: 'Avg Latency', value: insights.avgTotalMs ? (insights.avgTotalMs / 1000).toFixed(2) + 's' : 'N/A', icon: '⚡', color: 'brand-primary' },
              { label: 'Avg Risk Score', value: insights.avgRiskScore ? insights.avgRiskScore.toFixed(1) : 'N/A', icon: '⚠️', color: 'brand-accent' },
            ].map((metric, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="card-hover"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{metric.icon}</span>
                  <p className="text-xs text-dark-400">{metric.label}</p>
                </div>
                <p className="text-2xl font-bold text-brand-secondary">{metric.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Load History Button */}
      {!history.length && owner && repo && (
        <motion.div variants={itemVariants}>
          <button
            onClick={loadHistory}
            disabled={loading}
            className="w-full btn-primary py-4 text-lg font-semibold"
          >
            {loading ? '⏳ Loading...' : '📜 Load Review History & Statistics'}
          </button>
        </motion.div>
      )}

      {/* Review History Section */}
      {history.length > 0 && (
        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="subsection-title">Recent Review Activity</h2>
              <p className="text-xs text-dark-400">Last 20 pull request reviews</p>
            </div>
            <badge className="badge-info">{history.length} reviews</badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700 text-dark-400 text-xs font-semibold uppercase tracking-wide">
                  <th className="py-4 px-4 text-left">Timestamp</th>
                  <th className="py-4 px-4 text-left">PR #</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-4 text-center">Comments</th>
                  <th className="py-4 px-4 text-center">Risk Score</th>
                  <th className="py-4 px-4 text-right">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {history.map((run, idx) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-4 text-dark-300">
                      {new Date(run.createdAt).toLocaleDateString()} {new Date(run.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 px-4 font-mono text-brand-secondary font-semibold">#{run.prNumber}</td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                          run.status === 'completed'
                            ? 'badge-success'
                            : run.status === 'failed'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-current" />
                        {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-dark-300 font-medium">
                      {run.commentsPosted || 0}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`font-semibold ${
                        (run.avgRiskScore || 0) > 7 ? 'text-brand-danger' : 
                        (run.avgRiskScore || 0) > 4 ? 'text-brand-warning' : 
                        'text-brand-success'
                      }`}>
                        {run.avgRiskScore ? run.avgRiskScore.toFixed(1) : 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right text-dark-400">
                      {run.timingsMs?.total ? (run.timingsMs.total / 1000).toFixed(2) + 's' : 'N/A'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
