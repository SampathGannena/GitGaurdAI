import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Dashboard from './pages/Dashboard'
import RiskHeatmap from './pages/RiskHeatmap'
import FindingHistory from './pages/FindingHistory'
import SecurityTracker from './pages/SecurityTracker'
import ConfigurationLab from './pages/ConfigurationLab'
import ComplianceReport from './pages/ComplianceReport'
import TeamAnalytics from './pages/TeamAnalytics'
import WebhookMonitor from './pages/WebhookMonitor'
import AuthPage from './pages/AuthPage'

const API_BASE = 'http://localhost:3000'
const TOKEN_STORAGE_KEY = 'gitguard_auth_token'
const USER_STORAGE_KEY = 'gitguard_auth_user'

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [owner, setOwner] = useState('')
  const [repo, setRepo] = useState('')
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch (_) {
      return null
    }
  })

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    setToken('')
    setUser(null)
  }

  const handleAuthSuccess = ({ token: authToken, user: authUser }) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, authToken)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser))
    setToken(authToken)
    setUser(authUser)
  }

  const apiFetch = useMemo(
    () =>
      async (url, options = {}) => {
        const merged = {
          ...options,
          headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
          },
        }

        const res = await fetch(url, merged)
        if (res.status === 401) {
          logout()
          throw new Error('Session expired. Please sign in again.')
        }

        return res
      },
    [token]
  )

  useEffect(() => {
    if (!token) return

    apiFetch(`${API_BASE}/auth/me`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && data.user) {
          setUser(data.user)
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user))
        }
      })
      .catch(() => logout())
  }, [token])

  const pages = [
    { id: 'dashboard', label: '⚙️ Dashboard', icon: 'dashboard' },
    { id: 'risk-heatmap', label: '🔥 Risk Heatmap', icon: 'heatmap' },
    { id: 'finding-history', label: '🔄 Finding Dedup', icon: 'history' },
    { id: 'security-tracker', label: '🔒 Security', icon: 'security' },
    { id: 'team-analytics', label: '📊 Team Analytics', icon: 'analytics' },
    { id: 'compliance-report', label: '📋 Compliance', icon: 'compliance' },
    { id: 'config-lab', label: '🧪 Config Lab', icon: 'config' },
    { id: 'webhook-monitor', label: '🔗 Webhook Monitor', icon: 'monitor' },
  ]

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard apiBase={API_BASE} apiFetch={apiFetch} owner={owner} setOwner={setOwner} repo={repo} setRepo={setRepo} />
      case 'risk-heatmap':
        return <RiskHeatmap apiBase={API_BASE} apiFetch={apiFetch} owner={owner} repo={repo} />
      case 'finding-history':
        return <FindingHistory apiBase={API_BASE} apiFetch={apiFetch} owner={owner} repo={repo} />
      case 'security-tracker':
        return <SecurityTracker apiBase={API_BASE} apiFetch={apiFetch} owner={owner} repo={repo} />
      case 'team-analytics':
        return <TeamAnalytics apiBase={API_BASE} apiFetch={apiFetch} owner={owner} repo={repo} />
      case 'compliance-report':
        return <ComplianceReport apiBase={API_BASE} apiFetch={apiFetch} owner={owner} repo={repo} />
      case 'config-lab':
        return <ConfigurationLab />
      case 'webhook-monitor':
        return <WebhookMonitor />
      default:
        return <Dashboard apiBase={API_BASE} apiFetch={apiFetch} owner={owner} setOwner={setOwner} repo={repo} setRepo={setRepo} />
    }
  }

  if (!token) {
    return <AuthPage apiBase={API_BASE} onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="flex h-screen">
        {/* Sidebar Navigation */}
        <motion.aside
          initial={{ x: -256 }}
          animate={{ x: 0 }}
          className="w-64 border-r border-white/10 bg-black/40 backdrop-blur-xl overflow-auto"
        >
          <div className="p-6 border-b border-white/10">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">GitGuard AI</h1>
            <p className="text-xs text-slate-400 mt-1">Production Code Review</p>
            <div className="mt-3 text-xs text-slate-300 space-y-1">
              <p className="truncate">Signed in as</p>
              <p className="font-semibold text-slate-100 truncate">{user?.name || user?.email || 'User'}</p>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => setCurrentPage(page.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  currentPage === page.id
                    ? 'bg-violet-600/30 border border-violet-500/50 text-violet-100 font-medium'
                    : 'text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className="text-lg">{page.label.split(' ')[0]}</span>
                <span className="text-sm ml-2">{page.label.split(' ').slice(1).join(' ')}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 mt-8 border-t border-white/10">
            <p className="text-xs text-slate-500">Repository Context</p>
            <div className="mt-3 space-y-2 text-xs">
              {owner && <p className="text-slate-300"><span className="text-slate-500">Owner:</span> {owner}</p>}
              {repo && <p className="text-slate-300"><span className="text-slate-500">Repo:</span> {repo}</p>}
            </div>
            <button onClick={logout} className="btn-ghost w-full mt-4 text-xs">
              Sign Out
            </button>
          </div>
        </motion.aside>

        {/* Main Content */}
        <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 overflow-auto">
          <div className="p-8 max-w-6xl">
            {renderPage()}
          </div>
        </motion.main>
      </div>
    </div>
  )
}
