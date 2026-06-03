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
  {
    id: "dashboard",
    label: "Dashboard",
    hint: "Overview and latest scans",
    icon: "dashboard",
    category: "core",
  },
  {
    id: "pr-analysis",
    label: "PR Analysis",
    hint: "Review pull request findings",
    icon: "pullRequest",
    showInSidebar: false,
    category: "core",
  },
  {
    id: "settings",
    label: "Settings",
    hint: "Repository and account setup",
    icon: "settings",
    category: "core",
    showInSidebar: false,
  },
  {
    id: "risk-heatmap",
    label: "Risk Heatmap",
    hint: "Risk distribution by file",
    icon: "heatmap",
    category: "core",
  },
  {
    id: "finding-history",
    label: "Findings",
    hint: "Historical vulnerability log",
    icon: "history",
    category: "core",
  },
  {
    id: "security-tracker",
    label: "Security",
    hint: "Open security issues",
    icon: "shield",
    category: "core",
  },
  {
    id: "team-analytics",
    label: "Team",
    hint: "Reviewer and team metrics",
    icon: "team",
    category: "core",
  },
  {
    id: "compliance-report",
    label: "Compliance",
    hint: "Policy and audit reports",
    icon: "compliance",
    category: "core",
  },
  {
    id: "webhook-monitor",
    label: "Webhook",
    hint: "Delivery and event monitor",
    icon: "webhook",
    category: "core",
  },
  {
    id: "config-lab",
    label: "Lab",
    hint: "Experiment with rules",
    icon: "lab",
    category: "lab",
  },
  {
    id: "chat",
    label: "Chat",
    hint: "Ask the assistant",
    icon: "chat",
    category: "lab",
  },
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
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
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
  const [repoHistory, setRepoHistory] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [repositoryLoading, setRepositoryLoading] = useState(false);
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
    if (!query) return pages;
    return pages.filter((page) =>
      `${page.label} ${page.hint}`.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return {
        pages: filteredPages,
        prs: [],
        findings: [],
      };
    }

    const prMatches = repoHistory
      .filter((run) =>
        `${run.prNumber} ${run.prTitle || ""} ${run.prAuthor || ""}`
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 6);

    const findingCandidates = repoHistory.flatMap((run) =>
      (run.findings || []).map((finding) => ({
        ...finding,
        prNumber: run.prNumber,
        prTitle: run.prTitle,
      })),
    );

    const uniqueFindings = new Map();
    findingCandidates.forEach((finding) => {
      const key =
        finding.fingerprint ||
        `${finding.filePath}-${finding.title}-${finding.category}-${finding.severity}`;
      if (!uniqueFindings.has(key)) {
        uniqueFindings.set(key, finding);
      }
    });

    const findingMatches = Array.from(uniqueFindings.values())
      .filter((finding) =>
        `${finding.title || ""} ${finding.filePath || ""} ${finding.category || ""} ${
          finding.severity || ""
        }`
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 6);

    return {
      pages: filteredPages,
      prs: prMatches,
      findings: findingMatches,
    };
  }, [filteredPages, repoHistory, searchQuery]);

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken("");
    setUser(null);
    setOwner("");
    setRepo("");
    setRepoHistory([]);
  };

  const navigateToPage = (pageId) => {
    setCurrentPage(pageId);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const navigateToPr = (prNumber) => {
    openPrAnalysis(prNumber);
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
    if (!token || owner || repo) return;

    let isActive = true;
    const loadLinkedRepository = async () => {
      setRepositoryLoading(true);
      try {
        const response = await apiFetch(`${API_BASE}/settings/repositories`);
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.message || "Unable to load linked repositories");
        }
        const [latestRepository] = data.repositories || [];
        if (isActive && latestRepository) {
          setOwner(latestRepository.owner || "");
          setRepo(latestRepository.repo || "");
        }
      } catch (error) {
        if (isActive) {
          setSearchError(error.message);
        }
      } finally {
        if (isActive) setRepositoryLoading(false);
      }
    };

    loadLinkedRepository();
    return () => {
      isActive = false;
    };
  }, [apiFetch, token, owner, repo]);

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

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchLoading(false);
      setSearchError("");
      return;
    }
    if (!owner || !repo) {
      setRepoHistory([]);
      setSearchLoading(false);
      setSearchError("Add an owner and repository to search runs.");
      return;
    }

    let isActive = true;
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError("");
      try {
        const response = await apiFetch(
          `${API_BASE}/settings/${owner}/${repo}/history?limit=120`,
        );
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.message || "Failed to search repository history");
        }
        if (isActive) {
          setRepoHistory(data.history || []);
        }
      } catch (error) {
        if (isActive) {
          setRepoHistory([]);
          setSearchError(error.message);
        }
      } finally {
        if (isActive) setSearchLoading(false);
      }
    }, 240);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [API_BASE, apiFetch, owner, repo, searchQuery]);


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
            repositoryLoading={repositoryLoading}
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
      <div className="relative flex min-h-screen flex-col">
        <div className="flex flex-1 min-h-0">
        <aside
          className={`sticky top-0 hidden h-screen shrink-0 border-r border-white/10 bg-white/[0.035] p-3 backdrop-blur-xl transition-all duration-300 lg:flex lg:flex-col ${
            sidebarCollapsed ? "w-[88px] items-center" : "w-72"
          }`}
        >
          <div
            className={`flex items-center ${
              sidebarCollapsed
                ? "justify-center rounded-full border-0 bg-transparent p-0"
                : "gap-3 rounded-2xl border border-white/10 bg-black/25 p-3"
            }`}
          >
            <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-300 via-sky-200 to-white text-slate-950 shadow-lg shadow-cyan-500/40">
              <svg viewBox="0 0 48 48" className="h-8 w-8" aria-hidden="true">
                <defs>
                  <linearGradient id="gg-shield" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#064e3b" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                  <linearGradient id="gg-core" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#cbd5f5" />
                  </linearGradient>
                </defs>
                <path
                  d="M24 4 36 9v11.4c0 8.2-5.3 14.2-12 17.2-6.7-3-12-9-12-17.2V9l12-5Z"
                  fill="url(#gg-shield)"
                />
                <path
                  d="M24 12.2c4.6 0 8.3 3.2 8.3 7.6v1.4h-6.2c-.5 0-.9.4-.9.9v2.2h4.2c-.7 2.3-3 4-5.8 4-3.3 0-6-2.4-6-5.7s2.7-5.7 6-5.7c1.3 0 2.4.3 3.5 1l2.1-2.3c-1.6-1.1-3.5-1.8-5.6-1.8-4.9 0-8.8 3.6-8.8 8.4s3.9 8.4 8.8 8.4c4.8 0 8.3-3.1 8.3-7.6v-2.8c0-4.4-3.7-7.6-8.3-7.6Z"
                  fill="url(#gg-core)"
                />
              </svg>
              <span className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/40" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-semibold tracking-tight text-white">GitGuard AI</h1>
                <p className="text-xs text-slate-500">Internal review console</p>
              </div>
            )}
          </div>

          <nav
            className={`mt-6 flex-1 overflow-y-auto smooth-scroll ${
              sidebarCollapsed
                ? "flex flex-col items-center gap-4 pt-2"
                : "space-y-2 pr-1"
            }`}
          >
            {pages.filter((page) => page.showInSidebar !== false).map((page) => (
              <button
                key={page.id}
                onClick={() => navigateToPage(page.id)}
                title={sidebarCollapsed ? page.label : undefined}
                className={`group flex items-center text-left text-sm transition ${
                  sidebarCollapsed
                    ? "h-11 w-11 justify-center rounded-full border border-white/10 bg-black/85 p-0"
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

        </aside>

        <main className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0d0f1d]/90 px-3 py-3 backdrop-blur-xl sm:px-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarCollapsed((value) => !value)}
                className="grid h-11 w-11 shrink-0 place-items-center text-slate-300 transition hover:text-white"
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
                    if (event.key === "Enter") {
                      if (searchResults.pages[0]) navigateToPage(searchResults.pages[0].id);
                      else if (searchResults.prs[0]) navigateToPr(searchResults.prs[0].prNumber);
                      else if (searchResults.findings[0]) navigateToPage("finding-history");
                    }
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
                    {searchLoading && (
                      <div className="px-4 py-4 text-sm text-slate-400">Searching repository data...</div>
                    )}
                    {!searchLoading && searchError && (
                      <div className="px-4 py-4 text-sm text-amber-200">{searchError}</div>
                    )}
                    {!searchLoading && !searchError &&
                      !searchResults.pages.length &&
                      !searchResults.prs.length &&
                      !searchResults.findings.length && (
                        <div className="px-4 py-5 text-sm text-slate-400">
                          No matching entities found.
                        </div>
                      )}

                    {!!searchResults.pages.length && (
                      <div className="border-b border-white/10">
                        <p className="px-4 pt-4 text-[11px] uppercase tracking-[0.3em] text-slate-500">
                          Pages
                        </p>
                        {searchResults.pages.map((page) => (
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
                        ))}
                      </div>
                    )}

                    {!!searchResults.prs.length && (
                      <div className="border-b border-white/10">
                        <p className="px-4 pt-4 text-[11px] uppercase tracking-[0.3em] text-slate-500">
                          Pull requests
                        </p>
                        {searchResults.prs.map((run) => (
                          <button
                            key={`${run.prNumber}-${run.headSha}`}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => navigateToPr(run.prNumber)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/10"
                          >
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-cyan-200">
                              <Icon name="pullRequest" className="h-[18px] w-[18px]" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-white">
                                PR #{run.prNumber}
                              </span>
                              <span className="block truncate text-xs text-slate-500">
                                {(run.prTitle || "Untitled PR") +
                                  (run.prAuthor ? ` · ${run.prAuthor}` : "")}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {!!searchResults.findings.length && (
                      <div>
                        <p className="px-4 pt-4 text-[11px] uppercase tracking-[0.3em] text-slate-500">
                          Findings
                        </p>
                        {searchResults.findings.map((finding, index) => (
                          <button
                            key={`${finding.fingerprint || finding.filePath}-${index}`}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => navigateToPage("finding-history")}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/10"
                          >
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-cyan-200">
                              <Icon name="history" className="h-[18px] w-[18px]" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-white">
                                {finding.title || "Finding"}
                              </span>
                              <span className="block truncate text-xs text-slate-500">
                                {finding.filePath || "Unknown file"}
                                {finding.prNumber ? ` · PR #${finding.prNumber}` : ""}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigateToPage("settings")}
                className="grid h-12 w-12 shrink-0 place-items-center text-slate-200 transition hover:text-white"
                title="Settings"
              >
                <Icon name="settings" className="h-5 w-5" />
              </button>

              <button
                type="button"
                className="relative grid h-12 w-12 shrink-0 place-items-center text-slate-200 transition hover:text-white"
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
                className="grid h-12 w-12 shrink-0 place-items-center text-slate-200 transition hover:text-white"
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
            className="relative p-4 smooth-scroll md:p-6 xl:p-8"
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
        </main>
        </div>
        {currentPage === "dashboard" && (
          <footer className="footer-shell">
            <div className="footer-sheen" />
            <motion.div
              className="footer-inner"
              initial={{ opacity: 1, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <div className="footer-hero">
                <div className="footer-intro">
                  <p className="footer-eyebrow">Philadelphia · Live monitoring</p>
                  <h2 className="footer-title">
                    Ready to ship safer pull requests, or just watch the signal dance.
                  </h2>
                  <p className="footer-subtitle">
                    GitGuard AI listens to webhook events, analyzes diffs only, and posts
                    fix-ready review comments back to GitHub.
                  </p>
                  <div className="footer-actions">
                    <button
                      type="button"
                      onClick={() => navigateToPage("pr-analysis")}
                      className="footer-cta"
                    >
                      Open PR analysis
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateToPage("webhook-monitor")}
                      className="footer-ghost"
                    >
                      View webhook stream
                    </button>
                  </div>
                </div>
                <div className="footer-notes" aria-hidden="true">
                  {[
                    { label: "Diff only", accent: "note-cyan" },
                    { label: "Auto fixes", accent: "note-amber" },
                    { label: "Secure hooks", accent: "note-rose" },
                    { label: "LLM review", accent: "note-slate" },
                    { label: "Latency", accent: "note-olive" },
                    { label: "Audit trail", accent: "note-lilac" },
                  ].map((note, index) => (
                    <div
                      key={note.label}
                      className={`footer-note ${note.accent}`}
                      style={{
                        "--note-tilt": `${index % 2 === 0 ? -8 : 6}deg`,
                        "--note-delay": `${index * 0.18}s`,
                      }}
                    >
                      <span>{note.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="footer-links">
                <div className="footer-group compact">
                  <p className="footer-group-title">Production console</p>
                  <p className="footer-group-subtitle">
                    Pages used in daily PR review operations.
                  </p>
                  <div className="footer-link-grid compact">
                    {pages
                      .filter((page) => page.category === "core")
                      .map((page) => (
                        <button
                          key={page.id}
                          type="button"
                          onClick={() => navigateToPage(page.id)}
                          className={`footer-link ${currentPage === page.id ? "is-active" : ""}`}
                        >
                          <span>{page.label}</span>
                          <span className="footer-link-hint">{page.hint}</span>
                        </button>
                      ))}
                  </div>
                </div>

                <div className="footer-group compact">
                  <p className="footer-group-title">Labs and utilities</p>
                  <p className="footer-group-subtitle">
                    Keep these close, but out of the main flow.
                  </p>
                  <div className="footer-link-grid compact">
                    {pages
                      .filter((page) => page.category !== "core")
                      .map((page) => (
                        <button
                          key={page.id}
                          type="button"
                          onClick={() => navigateToPage(page.id)}
                          className={`footer-link ${currentPage === page.id ? "is-active" : ""}`}
                        >
                          <span>{page.label}</span>
                          <span className="footer-link-hint">{page.hint}</span>
                        </button>
                      ))}
                  </div>
                  <div className="footer-mini-links" aria-label="Support and policies">
                    <div className="footer-mini-column">
                      <p className="footer-mini-heading">Support</p>
                      <button type="button" className="footer-mini-link">Representation</button>
                      <button type="button" className="footer-mini-link">Services</button>
                    </div>
                    <div className="footer-mini-column">
                      <p className="footer-mini-heading">Terms</p>
                      <button type="button" className="footer-mini-link">Terms & conditions</button>
                      <button type="button" className="footer-mini-link">Cookie policy</button>
                    </div>
                  </div>
                </div>

                <div className="footer-group footer-status compact">
                  <p className="footer-group-title">Live context</p>
                  <div className="footer-status-card compact">
                    <div>
                      <p className="footer-status-label">Repository</p>
                      <p className="footer-status-value">{owner || "No owner"}</p>
                      <p className="footer-status-value accent">{repo || "No repo"}</p>
                    </div>
                    <div>
                      <p className="footer-status-label">Review mode</p>
                      <p className="footer-status-value">Diff analysis only</p>
                      <p className="footer-status-value">Auto-fix suggestions</p>
                    </div>
                  </div>
                  <div className="footer-social-bar" aria-label="Social links">
                    <button type="button" className="footer-social-button social-github" aria-label="GitHub">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M12 2a10 10 0 0 0-3.16 19.48c.5.1.68-.22.68-.48v-1.7c-2.77.6-3.36-1.34-3.36-1.34-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.6.07-.6 1 .08 1.53 1.04 1.53 1.04.9 1.53 2.36 1.09 2.94.83.1-.66.36-1.1.65-1.36-2.2-.25-4.52-1.1-4.52-4.9 0-1.08.4-1.96 1.03-2.65-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.9-1.3 2.74-1.02 2.74-1.02.56 1.38.2 2.4.1 2.65.64.7 1.03 1.57 1.03 2.65 0 3.8-2.32 4.64-4.53 4.88.37.32.7.94.7 1.9v2.8c0 .26.18.58.7.48A10 10 0 0 0 12 2Z"
                        />
                      </svg>
                    </button>
                    <button type="button" className="footer-social-button social-linkedin" aria-label="LinkedIn">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M20.45 20.45h-3.6v-5.6c0-1.34-.03-3.05-1.86-3.05-1.87 0-2.16 1.46-2.16 2.96v5.69H9.24V9h3.45v1.56h.05c.48-.9 1.66-1.86 3.4-1.86 3.64 0 4.32 2.4 4.32 5.5v6.25ZM5.34 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2Zm-1.8 13.05V9h3.6v11.45h-3.6Z"
                        />
                      </svg>
                    </button>
                    <button type="button" className="footer-social-button social-x" aria-label="X">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M18.8 3H21l-6.9 7.9L22 21h-6.2l-4.9-6.1L5.3 21H3l7.4-8.5L2 3h6.4l4.4 5.6L18.8 3Zm-2.1 16.2h1.7L7.5 4.7H5.7l11 14.5Z"
                        />
                      </svg>
                    </button>
                    <button type="button" className="footer-social-button social-slack" aria-label="Slack">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M9.7 3.6c0-1.2-1-2.2-2.2-2.2S5.3 2.4 5.3 3.6c0 1.2 1 2.2 2.2 2.2h2.2V3.6ZM9.7 8.1H7.5c-1.2 0-2.2 1-2.2 2.2s1 2.2 2.2 2.2h2.2V8.1Zm4.6 12.3c0 1.2 1 2.2 2.2 2.2s2.2-1 2.2-2.2c0-1.2-1-2.2-2.2-2.2h-2.2v2.2Zm0-4.6h2.2c1.2 0 2.2-1 2.2-2.2s-1-2.2-2.2-2.2h-2.2v4.4ZM3.6 14.3c-1.2 0-2.2 1-2.2 2.2s1 2.2 2.2 2.2c1.2 0 2.2-1 2.2-2.2v-2.2H3.6Zm4.6 0h4.4v4.4c0 1.2-1 2.2-2.2 2.2s-2.2-1-2.2-2.2v-4.4Zm12.2-4.6h-4.4V5.3c0-1.2 1-2.2 2.2-2.2s2.2 1 2.2 2.2v4.4Z"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="footer-meta">
                    <span>GitGuard AI · Secure review console</span>
                    <span>© 2026 GitGuard AI</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </footer>
        )}
      </div>
    </div>
  );
}
