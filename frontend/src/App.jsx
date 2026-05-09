import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Dashboard from "./pages/Dashboard";
import RiskHeatmap from "./pages/RiskHeatmap";
import FindingHistory from "./pages/FindingHistory";
import SecurityTracker from "./pages/SecurityTracker";
import ConfigurationLab from "./pages/ConfigurationLab";
import ComplianceReport from "./pages/ComplianceReport";
import TeamAnalytics from "./pages/TeamAnalytics";
import WebhookMonitor from "./pages/WebhookMonitor";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import PRAnalysisPage from "./pages/PRAnalysisPage";
import ChatPage from "./pages/ChatPage";
import SettingsPage from "./pages/SettingsPage";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";
const TOKEN_STORAGE_KEY = "gitguard_auth_token";
const USER_STORAGE_KEY = "gitguard_auth_user";

const pages = [
  { id: "dashboard", label: "Dashboard", marker: "D" },
  { id: "pr-analysis", label: "PR Analysis", marker: "P" },
  { id: "settings", label: "Settings", marker: "S" },
  { id: "risk-heatmap", label: "Risk Heatmap", marker: "R" },
  { id: "finding-history", label: "Findings", marker: "F" },
  { id: "security-tracker", label: "Security", marker: "V" },
  { id: "team-analytics", label: "Team", marker: "T" },
  { id: "compliance-report", label: "Compliance", marker: "C" },
  { id: "webhook-monitor", label: "Webhook", marker: "W" },
  { id: "config-lab", label: "Lab", marker: "L" },
  { id: "chat", label: "Chat", marker: "M" },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [owner, setOwner] = useState("SampathGannena");
  const [repo, setRepo] = useState("gitguard-ai-sentinel");
  const [selectedPRNumber, setSelectedPRNumber] = useState("");
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  });
  const [showAuth, setShowAuth] = useState(false);

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken("");
    setUser(null);
  };

  const handleAuthSuccess = ({ token: authToken, user: authUser }) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);
  };

  const apiFetch = useMemo(
    () => async (url, options = {}) => {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        logout();
        throw new Error("Session expired. Please sign in again.");
      }

      return response;
    },
    [token],
  );

  useEffect(() => {
    if (!token) return;

    apiFetch(`${API_BASE}/auth/me`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && data.user) {
          setUser(data.user);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        }
      })
      .catch(() => logout());
  }, [token]);

  const openPrAnalysis = (prNumber) => {
    setSelectedPRNumber(String(prNumber || ""));
    setCurrentPage("pr-analysis");
  };

  const sharedProps = {
    apiBase: API_BASE,
    apiFetch,
    owner,
    setOwner,
    repo,
    setRepo,
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <Dashboard
            {...sharedProps}
            onSelectPR={openPrAnalysis}
            onOpenSettings={() => setCurrentPage("settings")}
          />
        );
      case "pr-analysis":
        return (
          <PRAnalysisPage
            apiBase={API_BASE}
            apiFetch={apiFetch}
            owner={owner}
            repo={repo}
            prNumber={selectedPRNumber}
            onPrNumberChange={setSelectedPRNumber}
            onClose={() => setCurrentPage("dashboard")}
          />
        );
      case "settings":
        return <SettingsPage {...sharedProps} />;
      case "risk-heatmap":
        return <RiskHeatmap apiBase={API_BASE} apiFetch={apiFetch} owner={owner} repo={repo} />;
      case "finding-history":
        return <FindingHistory apiBase={API_BASE} apiFetch={apiFetch} owner={owner} repo={repo} />;
      case "security-tracker":
        return <SecurityTracker apiBase={API_BASE} apiFetch={apiFetch} owner={owner} repo={repo} />;
      case "team-analytics":
        return <TeamAnalytics apiBase={API_BASE} apiFetch={apiFetch} owner={owner} repo={repo} />;
      case "compliance-report":
        return <ComplianceReport apiBase={API_BASE} apiFetch={apiFetch} owner={owner} repo={repo} />;
      case "webhook-monitor":
        return <WebhookMonitor />;
      case "config-lab":
        return <ConfigurationLab />;
      case "chat":
        return <ChatPage apiBase={API_BASE} apiFetch={apiFetch} owner={owner} repo={repo} />;
      default:
        return <Dashboard {...sharedProps} onSelectPR={openPrAnalysis} />;
    }
  };

  if (!token) {
    if (!showAuth) {
      return <LandingPage onGetStarted={() => setShowAuth(true)} onSignIn={() => setShowAuth(true)} />;
    }
    return <AuthPage apiBase={API_BASE} onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(167,139,250,0.14),transparent_28%)]" />
      <div className="relative flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl lg:block">
          <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-300 text-sm font-black text-slate-950">
                GG
              </div>
              <div>
                <h1 className="font-semibold tracking-tight text-white">GitGuard AI</h1>
                <p className="text-xs text-slate-500">Internal review console</p>
              </div>
            </div>
          </div>

          <nav className="mt-5 space-y-1">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => setCurrentPage(page.id)}
                className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition ${
                  currentPage === page.id
                    ? "bg-white text-slate-950"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-xl text-xs font-semibold ${
                    currentPage === page.id ? "bg-slate-950 text-white" : "bg-white/10 text-slate-300"
                  }`}
                >
                  {page.marker}
                </span>
                {page.label}
              </button>
            ))}
          </nav>

          <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Context</p>
            <p className="mt-3 truncate text-sm font-medium text-white">{owner || "No owner"}</p>
            <p className="truncate text-sm text-cyan-200">{repo || "No repository"}</p>
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="truncate text-xs text-slate-500">Signed in</p>
              <p className="truncate text-sm text-slate-300">{user?.name || user?.email || "User"}</p>
              <button onClick={logout} className="mt-3 w-full rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/10">
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden">
          <header className="sticky top-0 z-10 border-b border-white/10 bg-[#09090b]/80 px-4 py-3 backdrop-blur-xl lg:hidden">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">GitGuard AI</p>
              <select value={currentPage} onChange={(e) => setCurrentPage(e.target.value)} className="control-input w-44 py-2 text-sm">
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.label}
                  </option>
                ))}
              </select>
            </div>
          </header>

          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-screen overflow-auto p-4 md:p-6 xl:p-8"
          >
            <div className="mx-auto max-w-7xl">{renderPage()}</div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
