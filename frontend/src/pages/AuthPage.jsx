import React, { useState } from 'react'
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

export default function AuthPage({ apiBase, onAuthSuccess }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState('info')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus('')

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const payload = mode === 'login' ? { email, password } : { name, email, password }

      const res = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || !data.ok) {
        throw new Error(data.message || 'Authentication failed')
      }

      onAuthSuccess(data)
    } catch (err) {
      setStatus(`✕ ${err.message}`)
      setStatusType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 text-dark-100 flex items-center justify-center p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 glass rounded-3xl overflow-hidden border border-white/10"
      >
        <motion.div variants={itemVariants} className="p-8 lg:p-10 bg-gradient-to-br from-brand-primary/20 via-brand-secondary/10 to-transparent">
          <h1 className="text-4xl font-black bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
            GitGuard AI
          </h1>
          <p className="text-dark-300 mt-2">Secure AI-driven pull request reviews for every team.</p>

          <div className="mt-10 space-y-4">
            {[
              { icon: '🛡️', text: 'Webhook signature verification for secure ingestion' },
              { icon: '🧠', text: 'Diff-focused LLM analysis with actionable fixes' },
              { icon: '📈', text: 'Team analytics and compliance insights' },
            ].map((item) => (
              <div key={item.text} className="glass rounded-xl p-3 flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <p className="text-sm text-dark-300">{item.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="p-8 lg:p-10">
          <div className="flex gap-2 mb-6 bg-dark-900/70 rounded-xl p-1 border border-dark-700">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                mode === 'login' ? 'bg-brand-primary text-white' : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                mode === 'register' ? 'bg-brand-primary text-white' : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-sm text-dark-300">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Your name"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm text-dark-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-dark-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Minimum 8 characters"
                minLength={8}
                required
              />
            </div>

            {status && (
              <div className={`rounded-lg px-3 py-2 text-sm border ${statusType === 'error' ? 'bg-brand-danger/10 border-brand-danger/30 text-brand-danger' : 'bg-brand-secondary/10 border-brand-secondary/30 text-brand-secondary'}`}>
                {status}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  )
}