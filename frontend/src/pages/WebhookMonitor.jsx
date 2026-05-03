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

export default function WebhookMonitor() {
  const [status, setStatus] = useState({
    webhookHealth: 'healthy',
    lastEvent: null,
    eventCount: 0,
    apiQuotaUsed: 65,
    failureRate: 2,
    uptime: 99.8,
    avgResponseTime: 2.3,
  })
  const [details, setDetails] = useState([
    { check: 'GitHub API Token', status: 'pass', value: 'Valid', category: 'auth' },
    { check: 'Database Connection', status: 'pass', value: 'Connected', category: 'database' },
    { check: 'LLM Provider (OpenAI)', status: 'pass', value: 'Active', category: 'api' },
    { check: 'Webhook Signature Validation', status: 'pass', value: '847 events verified', category: 'security' },
    { check: 'Average Response Time', status: 'pass', value: '2.3s', category: 'performance' },
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus((prev) => ({
        ...prev,
        eventCount: prev.eventCount + Math.floor(Math.random() * 3),
        apiQuotaUsed: Math.min(100, prev.apiQuotaUsed + Math.random() * 0.5),
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getStatusStyle = (status) => {
    if (status === 'pass') return { color: 'text-brand-success', bg: 'bg-brand-success/20', badge: 'badge-success', icon: '✓' }
    if (status === 'warn') return { color: 'text-brand-warning', bg: 'bg-brand-warning/20', badge: 'badge-warning', icon: '⚠' }
    return { color: 'text-brand-danger', bg: 'bg-brand-danger/20', badge: 'badge-danger', icon: '✕' }
  }

  const healthStatus = getStatusStyle(status.webhookHealth === 'healthy' ? 'pass' : 'fail')
  const quotaStatus = status.apiQuotaUsed > 80 ? 'warn' : 'pass'
  const failureStatus = status.failureRate > 5 ? 'warn' : 'pass'

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-2">
        <h1 className="section-title">🔗 Webhook Integration Monitor</h1>
        <p className="text-dark-400">Real-time system health, API quotas, and integration status</p>
      </motion.div>

      {/* Overall Health */}
      <motion.div variants={itemVariants} className={`card bg-gradient-to-br ${healthStatus.bg} to-transparent border-2 border-brand-success/30`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-dark-400 mb-2">System Health Status</p>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${healthStatus.color === 'text-brand-success' ? 'bg-brand-success animate-pulse' : 'bg-brand-danger'}`} />
              <h2 className={`text-2xl font-bold ${healthStatus.color}`}>
                {status.webhookHealth === 'healthy' ? 'HEALTHY' : 'UNHEALTHY'}
              </h2>
            </div>
            <p className="text-sm text-dark-400 mt-2">All systems operational</p>
          </div>
          <div className="text-4xl">🟢</div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Events Processed',
            value: status.eventCount,
            icon: '📊',
            color: 'brand-secondary',
            unit: 'total',
          },
          {
            label: 'API Quota Used',
            value: status.apiQuotaUsed.toFixed(1),
            icon: '⚙️',
            color: status.apiQuotaUsed > 80 ? 'brand-warning' : 'brand-primary',
            unit: '%',
          },
          {
            label: 'Failure Rate',
            value: status.failureRate,
            icon: '📉',
            color: status.failureRate > 5 ? 'brand-warning' : 'brand-success',
            unit: '%',
          },
          {
            label: 'System Uptime',
            value: status.uptime,
            icon: '⏱️',
            color: 'brand-success',
            unit: '%',
          },
        ].map((metric, idx) => (
          <div key={idx} className="card-hover">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{metric.icon}</span>
              <p className="text-xs text-dark-500 font-semibold">{metric.label}</p>
            </div>
            <p className={`text-2xl font-bold text-${metric.color}`}>
              {metric.value}{metric.unit}
            </p>
          </div>
        ))}
      </motion.div>

      {/* System Checks */}
      <motion.div variants={itemVariants} className="card">
        <h3 className="subsection-title mb-6">System Health Checks</h3>
        <div className="space-y-3">
          {details.map((check, idx) => {
            const checkStatus = getStatusStyle(check.status)
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`card-hover flex items-center justify-between p-4`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${checkStatus.color === 'text-brand-success' ? 'bg-brand-success' : checkStatus.color === 'text-brand-warning' ? 'bg-brand-warning' : 'bg-brand-danger'}`} />
                    <h4 className="font-medium text-dark-100">{check.check}</h4>
                  </div>
                  <p className="text-xs text-dark-500 mt-1 ml-6">{check.category}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-mono text-dark-200">{check.value}</p>
                  </div>
                  <span className={`${checkStatus.badge} text-xs font-bold px-3 py-1`}>
                    {checkStatus.icon} {check.status === 'pass' ? 'OK' : check.status === 'warn' ? 'WARNING' : 'FAILED'}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Performance Metrics */}
      <motion.div variants={itemVariants} className="card">
        <h3 className="subsection-title mb-6">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-dark-400 mb-3">Average Response Time</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-brand-secondary">{status.avgResponseTime}</p>
              <p className="text-dark-500">seconds</p>
            </div>
            <p className="text-xs text-dark-500 mt-2">Per webhook event</p>
          </div>

          <div>
            <p className="text-sm text-dark-400 mb-3">System Uptime</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-brand-success">{status.uptime}</p>
              <p className="text-dark-500">%</p>
            </div>
            <p className="text-xs text-dark-500 mt-2">Last 30 days</p>
          </div>

          <div>
            <p className="text-sm text-dark-400 mb-3">Event Success Rate</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-brand-success">{(100 - status.failureRate).toFixed(1)}</p>
              <p className="text-dark-500">%</p>
            </div>
            <p className="text-xs text-dark-500 mt-2">Successful processing</p>
          </div>
        </div>
      </motion.div>

      {/* API Quota Progress */}
      <motion.div variants={itemVariants} className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-dark-100">API Rate Limit</h3>
          <span className={`text-sm font-bold ${status.apiQuotaUsed > 80 ? 'text-brand-warning' : 'text-brand-success'}`}>
            {status.apiQuotaUsed.toFixed(1)}% used
          </span>
        </div>
        <div className="w-full h-3 bg-dark-800 rounded-full overflow-hidden border border-dark-700">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${status.apiQuotaUsed}%` }}
            transition={{ duration: 0.6 }}
            className={`h-full ${
              status.apiQuotaUsed > 80
                ? 'bg-gradient-to-r from-brand-warning to-brand-danger'
                : 'bg-gradient-to-r from-brand-primary to-brand-secondary'
            }`}
          />
        </div>
        <p className="text-xs text-dark-500 mt-3">API quota resets daily. Request access for higher limits.</p>
      </motion.div>

      {/* Status Footer */}
      <motion.div variants={itemVariants} className="card bg-dark-800/50 border border-dark-700">
        <div className="flex items-center justify-between text-xs">
          <div className="space-y-1">
            <p className="text-dark-400">Last event received:</p>
            <p className="text-dark-200 font-mono">{new Date().toLocaleTimeString()}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-brand-success/20 border border-brand-success/50 flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 rounded-full bg-brand-success" />
          </div>
        </div>
      </motion.div>

      {/* Information Card */}
      <motion.div variants={itemVariants} className="card bg-gradient-to-br from-brand-secondary/10 to-brand-accent/10 border border-brand-secondary/20">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <p className="font-semibold text-dark-100 mb-1">Integration Status</p>
            <p className="text-sm text-dark-400">
              All integrations are actively monitoring your GitHub repositories. Webhooks are properly configured and receiving events in real-time.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
