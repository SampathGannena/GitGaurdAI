import React, { useEffect, useMemo, useRef, useState } from "react";
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
const SIDEBAR_STORAGE_KEY = "gitguard_sidebar_collapsed";

const pages = [
  { id: "dashboard", label: "Dashboard", hint: "Overview and latest scans", icon: "dashboard" },
  { id: "pr-analysis", label: "PR Analysis", hint: "Review pull request findings", icon: "pullRequest" },
  { id: "settings", label: "Settings", hint: "Repository and account setup", icon: "settings" },
  { id: "risk-heatmap", label: "Risk Heatmap", hint: "Risk distribution by file", icon: "heatmap" },
  { id: "finding-history", label: "Findings", hint: "Historical vulnerability log", icon: "history" },
  { id: "security-tracker", label: "Security", hint: "Open security issues", icon: "shield" },
  { id: "team-analytics", label: "Team", hint: "Reviewer and team metrics", icon: "team" },
  { id: "compliance-report", label: "Compliance", hint: "Policy and audit reports", icon: "compliance" },
  { id: "webhook-monitor", label: "Webhook", hint: "Delivery and event monitor", icon: "webhook" },
  { id: "config-lab", label: "Lab", hint: "Experiment with rules", icon: "lab" },
  { id: "chat", label: "Chat", hint: "Ask the assistant", icon: "chat" },
];

const Icon = ({ name, className = "h-5 w-5" }) => {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="8" rx="1.6" />
          <rect x="14" y="3" width="7" height="5" rx="1.6" />
          <rect x="14" y="12" width="7" height="9" rx="1.6" />
          <rect x="3" y="15" width="7" height="6" rx="1.6" />
        </svg>
      );
    case "pullRequest":
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="2.4" />
          <circle cx="18" cy="18" r="2.4" />
          <path d="M6 8.5v9A3.5 3.5 0 0 0 9.5 21H12" />
          <path d="M18 15.5V7a4 4 0 0 0-4-4h-2" />
          <path d="m14 6-2-3 2-3" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <path d="M12 8.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4Z" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.37a1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.08a1.7 1.7 0 0 0-1-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.63 15a1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.08a1.7 1.7 0 0 0 1.56-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.63a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.08a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.37 9c.25.61.84 1 1.56 1H21a2 2 0 1 1 0 4h-.08a1.7 1.7 0 0 0-1.56 1Z" />
        </svg>
      );
    case "heatmap":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="5" height="5" rx="1.2" />
          <rect x="9.5" y="4" width="5" height="5" rx="1.2" />
          <rect x="16" y="4" width="5" height="5" rx="1.2" />
          <rect x="3" y="10.5" width="5" height="5" rx="1.2" />
          <rect x="9.5" y="10.5" width="5" height="5" rx="1.2" />
          <rect x="16" y="10.5" width="5" height="5" rx="1.2" />
          <rect x="3" y="17" width="5" height="3" rx="1.2" />
          <rect x="9.5" y="17" width="5" height="3" rx="1.2" />
          <rect x="16" y="17" width="5" height="3" rx="1.2" />
        </svg>
      );
    case "history":
      return (
        <svg {...common}>
          <path d="M4 12a8 8 0 1 0 2.34-5.66" />
          <path d="M4 4v5h5" />
          <path d="M12 7v5l3.2 2" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 5 6v5.4c0 4.45 2.86 7.75 7 9.6 4.14-1.85 7-5.15 7-9.6V6l-7-3Z" />
          <path d="m9.2 12 1.9 1.9 4-4" />
        </svg>
      );
    case "team":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
          <path d="M16 11a2.6 2.6 0 1 0-.7-5.1" />
          <path d="M17 15c2.25.33 3.75 1.9 3.75 4" />
        </svg>
      );
    case "compliance":
      return (
        <svg {...common}>
          <path d="M8 3h7l4 4v13a1 1 0 0 1-1 1H8a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" />
          <path d="M14 3v5h5" />
          <path d="m8.5 14 2 2 4.5-5" />
        </svg>
      );
    case "webhook":
      return (
        <svg {...common}>
          <path d="M9.6 6.2A4.2 4.2 0 0 1 17 9v1.5" />
          <path d="M14.4 17.8A4.2 4.2 0 0 1 7 15v-1.5" />
          <circle cx="6" cy="10.5" r="2.5" />
          <circle cx="18" cy="13.5" r="2.5" />
          <path d="M8.5 10.5H12l2 3h1.5" />
        </svg>
      );
    case "lab":
      return (
        <svg {...common}>
          <path d="M10 3v5.2L5.1 17A3 3 0 0 0 7.7 21h8.6a3 3 0 0 0 2.6-4L14 8.2V3" />
          <path d="M8 3h8" />
          <path d="M7.3 16h9.4" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2h7A3.5 3.5 0 0 1 19 5.5v5A3.5 3.5 0 0 1 15.5 14H11l-4.5 4v-4A3.5 3.5 0 0 1 3 10.5v-5Z" />
          <path d="M8 7h8" />
          <path d="M8 10h5" />
        </svg>
      );
    case "panel":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M9 5v14" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...common}>
          <path d="M14.5 6.5 9 12l5.5 5.5" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path d="M18 9a6 6 0 1 0-12 0c0 7-3 6-3 8h18c0-2-3-1-3-8" />
          <path d="M10 21h4" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );
    default:
      return null;
  }
};

const PageLoader = ({ label }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="absolute inset-0 z-20 grid place-items-center bg-[#09090b]/75 backdrop-blur-xl"
  >
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-14 w-14">
        <span className="absolute inset-0 rounded-full border border-cyan-300/20" />
        <span className="absolute inset-1 animate-spin rounded-full border-2 border-transparent border-r-violet-400 border-t-cyan-300" />
        <span className="absolute inset-4 rounded-full bg-white" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white">Loading {label}</p>
        <p className="mt-1 text-xs text-slate-500">Preparing workspace</p>
      </div>
    </div>
  </motion.div>
);

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [visitedPages, setVisitedPages] = useState(() => new Set());
  const [pageLoading, setPageLoading] = useState(true);
  const searchInputRef = useRef(null);

  const currentPageMeta = pages.find((page) => page.id === currentPage) || pages[0];
  const userName = user?.name || user?.login || "Sampath Gannena";
  const userEmail = user?.email || "gannenasampath@gmail.com";
  const userInitials =
    userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "SA";

  const filteredPages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return pages.slice(0, 6);
    return pages.filter((page) =>
      `${page.label} ${page.hint} ${owner} ${repo}`.toLowerCase().includes(query),
    );
  }, [owner, repo, searchQuery]);

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken("");
    setUser(null);
  };

  const navigateToPage = (pageId) => {
    setCurrentPage(pageId);
    setSearchOpen(false);
    setSearchQuery("");
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

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (visitedPages.has(currentPage)) {
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    const timer = window.setTimeout(() => {
      setVisitedPages((previous) => {
        const next = new Set(previous);
        next.add(currentPage);
        return next;
      });
      setPageLoading(false);
    }, 650);

    return () => window.clearTimeout(timer);
  }, [currentPage, visitedPages]);

  const openPrAnalysis = (prNumber) => {
    setSelectedPRNumber(String(prNumber || ""));
    navigateToPage("pr-analysis");
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
            onOpenSettings={() => navigateToPage("settings")}
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
            onClose={() => navigateToPage("dashboard")}
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
        <aside
          className={`sticky top-0 hidden h-screen shrink-0 border-r border-white/10 bg-white/[0.035] p-3 backdrop-blur-xl transition-all duration-300 lg:flex lg:flex-col ${
            sidebarCollapsed ? "w-[88px]" : "w-72"
          }`}
        >
          <div
            className={`flex items-center border border-white/10 bg-black/25 p-3 ${
              sidebarCollapsed ? "justify-center rounded-full" : "gap-3 rounded-2xl"
            }`}
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cyan-300 text-sm font-black text-slate-950">
              GG
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-semibold tracking-tight text-white">GitGuard AI</h1>
                <p className="text-xs text-slate-500">Internal review console</p>
              </div>
            )}
          </div>

          <nav className="mt-5 flex-1 space-y-2 overflow-y-auto pr-1 smooth-scroll">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => navigateToPage(page.id)}
                title={sidebarCollapsed ? page.label : undefined}
                className={`group flex items-center text-left text-sm transition ${
                  sidebarCollapsed
                    ? "mx-auto h-11 w-11 justify-center rounded-full border border-white/10 bg-black/85 p-0"
                    : "w-full gap-3 rounded-2xl px-3 py-2.5"
                } ${
                  currentPage === page.id
                    ? sidebarCollapsed
                      ? "text-cyan-200 ring-2 ring-cyan-400/30"
                      : "bg-white text-slate-950 shadow-lg shadow-cyan-950/20"
                    : sidebarCollapsed
                      ? "text-slate-300 hover:text-white hover:ring-2 hover:ring-white/10"
                      : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                    sidebarCollapsed
                      ? "bg-black text-slate-100"
                      : currentPage === page.id
                        ? "bg-slate-950 text-white"
                        : "bg-white/10 text-slate-300"
                  }`}
                >
                  <Icon name={page.icon} className="h-[18px] w-[18px]" />
                </span>
                {!sidebarCollapsed && (
                  <span className="min-w-0">
                    <span className="block font-medium">{page.label}</span>
                    <span
                      className={`block truncate text-xs ${
                        currentPage === page.id ? "text-slate-600" : "text-slate-500"
                      }`}
                    >
                      {page.hint}
                    </span>
                  </span>
                )}
              </button>
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Context</p>
              <p className="mt-3 truncate text-sm font-medium text-white">{owner || "No owner"}</p>
              <p className="truncate text-sm text-cyan-200">{repo || "No repository"}</p>
            </div>
          )}

          <div
            className={`mt-4 border-t border-white/10 pt-4 ${
              sidebarCollapsed ? "flex justify-center" : "flex items-center justify-between gap-3"
            }`}
          >
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">GitGuard</p>
                <p className="mt-1 truncate text-xs text-slate-400">AI review console</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((value) => !value)}
              className={`grid h-10 w-10 shrink-0 place-items-center border border-white/10 text-slate-200 transition hover:text-white ${
                sidebarCollapsed
                  ? "rounded-full bg-black/85 hover:bg-black"
                  : "rounded-2xl bg-white/5 hover:bg-white/10"
              }`}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <motion.span
                animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
              >
                <Icon name="chevron" className="h-4.5 w-4.5" />
              </motion.span>
            </button>
          </div>
        </aside>

        <main className="flex h-screen flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0d0f1d]/90 px-3 py-3 backdrop-blur-xl sm:px-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarCollapsed((value) => !value)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <motion.span
                  animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                >
                  <Icon name="chevron" className="h-5 w-5" />
                </motion.span>
              </button>

              <div className="relative min-w-0 flex-1 lg:max-w-3xl">
                <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && filteredPages[0]) navigateToPage(filteredPages[0].id);
                    if (event.key === "Escape") setSearchOpen(false);
                  }}
                  placeholder="Search repos, scans, vulnerabilities..."
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 pl-12 pr-16 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-black/30 focus:ring-4 focus:ring-cyan-300/10 sm:text-base"
                />
                <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-400 sm:block">
                  Ctrl K
                </kbd>
                {searchOpen && (
                  <div className="absolute left-0 right-0 top-14 z-40 overflow-hidden rounded-2xl border border-white/10 bg-[#111320]/95 shadow-2xl shadow-black/30 backdrop-blur-xl">
                    {filteredPages.length ? (
                      filteredPages.map((page) => (
                        <button
                          key={page.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => navigateToPage(page.id)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/10"
                        >
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-cyan-200">
                            <Icon name={page.icon} className="h-[18px] w-[18px]" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-white">{page.label}</span>
                            <span className="block truncate text-xs text-slate-500">{page.hint}</span>
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-5 text-sm text-slate-400">No matching pages found.</div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                title="Notifications"
              >
                <Icon name="bell" className="h-5 w-5" />
                <span className="absolute right-3 top-2 h-2.5 w-2.5 rounded-full border border-[#0d0f1d] bg-cyan-300" />
              </button>

              <div className="hidden min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-4 sm:flex">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-500 text-sm font-bold text-slate-950 ring-2 ring-violet-300/30">
                  {userInitials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{userName}</p>
                  <p className="truncate text-xs text-slate-500">{userEmail}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                title="Sign out"
              >
                <Icon name="logout" className="h-5 w-5" />
              </button>
            </div>
          </header>

          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative flex-1 overflow-auto p-4 smooth-scroll md:p-6 xl:p-8"
          >
            <div className="mx-auto max-w-7xl">
              <div className="mb-5 flex items-center gap-3 lg:hidden">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-950">
                  <Icon name={currentPageMeta.icon} className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{currentPageMeta.label}</p>
                  <p className="text-xs text-slate-500">{currentPageMeta.hint}</p>
                </div>
              </div>
              {renderPage()}
            </div>
            {pageLoading && <PageLoader label={currentPageMeta.label} />}
          </motion.div>
          <footer className="border-t border-white/10 bg-black/30 px-6 py-4 text-xs text-slate-500">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-center sm:flex-row">
              <span>GitGuard AI · Secure review console</span>
              <span>© 2026 GitGuard AI</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
