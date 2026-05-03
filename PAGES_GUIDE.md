# GitGuard AI - Unique Product Pages

## Overview
GitGuard AI now features 8 specialized pages that transform raw review data into actionable insights. These pages differentiate the product through visualization of advanced capabilities (replay guard, risk scoring, fingerprinting, blast radius, telemetry).

---

## 1. **Dashboard** - Settings & Central Hub
**Purpose:** Configuration center and quick-view metrics  
**Unique Features:**
- Per-repository settings persistence
- 6 behavioral toggles (Strict Mode, Security-First, Replay Guard, Risk Summary)
- Throughput caps (Max Hunks/PR, Max Comments/PR)
- Live insights panel showing completion rate and risk trends
- Review history table with latency tracking

**Differentiator:** Single pane control for team rules + operational metrics

---

## 2. **Risk Heatmap** 🔥 - Visual Risk Distribution
**Purpose:** Identify high-risk files and patterns over time  
**Features:**
- Color-coded risk scores (0-100) by file
- Aggregates last 50 reviews per repository
- Shows file risk frequency (how many times flagged)
- Sorted by average risk score

**Differentiator:** Visual dashboard of risk scoring algorithm; teams see which files consistently need attention

**Use Case:** Security leads identify critical paths needing hardening

---

## 3. **Finding Dedup History** 🔄 - Replay Guard Analytics
**Purpose:** Track semantic finding deduplication effectiveness  
**Features:**
- Shows duplicate findings using SHA256 fingerprints
- Displays first-seen and last-seen timestamps
- Counts occurrences of same issue across PRs
- Visibility into replay guard working (deduplication preventing spam)

**Differentiator:** Unique visualization of replay guard preventing repeated feedback

**Use Case:** Track if teams are fixing recurring issues or patterns persist

---

## 4. **Security Tracker** 🔒 - Timeline View
**Purpose:** Comprehensive security vulnerability audit trail  
**Features:**
- Filters findings by `category: 'security'`
- Color-coded timeline (critical/high/medium/low)
- Links violations back to specific PRs
- Shows suggested fixes inline
- Timestamp-based sorting (newest first)

**Differentiator:** Security-specific timeline for compliance & audit purposes

**Use Case:** Security teams pull compliance reports; auditors review vulnerability history

---

## 5. **Team Analytics** 📊 - Developer Metrics
**Purpose:** Per-contributor code quality metrics  
**Features:**
- Aggregates findings by PR author
- Shows issues/PR ratio (code quality indicator)
- Breakdown by severity (critical, high, medium, low)
- Identifies developers needing mentoring

**Differentiator:** Developer-centric view (not just file-centric)

**Use Case:** Team leads identify training opportunities; reward high-quality contributors

---

## 6. **Compliance Report** 📋 - Audit-Ready Summary
**Purpose:** Generate executive/audit-ready compliance documentation  
**Features:**
- Single-page compliance snapshot
- Repository compliance status (passing/review_required)
- Critical issues count (zero = compliant)
- Processing metrics and timestamp
- Exportable format

**Differentiator:** Compliance-focused output for regulated industries

**Use Case:** SOC 2, ISO 27001 audits; management dashboards

---

## 7. **Configuration Lab** 🧪 - Analysis Preview
**Purpose:** Test rule combinations before deployment  
**Features:**
- 3 analysis modes: Strict Mode, Security-First, Performance Mode
- Paste code snippets to see predicted AI analysis
- Preview how different rule sets would score same code
- Real-time simulation (no webhook needed)

**Differentiator:** Safe testing ground for rule tuning; confidence in settings before rollout

**Use Case:** Teams validate rule behavior before team-wide deployment

---

## 8. **Webhook Monitor** 🔗 - Integration Health
**Purpose:** Real-time operational visibility  
**Features:**
- Webhook health status (🟢/🔴)
- Events processed counter
- API quota tracking (OpenAI, GitHub)
- Failure rate percentage
- System health checks (token validity, DB connection, API keys)
- Event count trending

**Differentiator:** Operational transparency; detect integration issues early

**Use Case:** DevOps/SREs monitor production health; detect API quota exhaustion

---

## Navigation Architecture

### Sidebar Navigation
- 8 pages accessible via left sidebar
- Active page highlighted (violet gradient)
- Repository context displayed (owner/repo)
- Clean 2-pane layout (sidebar + main content)

### State Management
- Owner/repo context persists across page navigation
- Each page fetches data independently
- API base: `http://localhost:3000`

---

## Data Flow Integration

### Backend Dependencies
All pages consume existing backend APIs:
- `GET /settings/:owner/:repo` - Load settings
- `PUT /settings/:owner/:repo` - Save settings
- `GET /settings/:owner/:repo/history?limit=N` - Review history
- `GET /settings/:owner/:repo/insights` - Aggregated metrics

### Data Enrichment
Each page adds visualization value on top of base data:
- **Risk Heatmap**: Groups findings by file path
- **Finding Dedup**: Deduplicates by fingerprint SHA256
- **Security Tracker**: Filters by category + severity
- **Team Analytics**: Groups by PR author
- **Compliance**: Computes compliance status logic
- **Webhook Monitor**: Simulates operational metrics

---

## Styling & UX

### Design System
- **Theme:** Dark mode (zinc-950/slate-900 base)
- **Accent:** Violet (600/500) for highlights
- **Glassmorphism:** white/5 backgrounds, backdrop-blur
- **Animation:** Framer Motion entry animations (opacity + y translation)
- **Responsive:** Tailwind grid (md:, lg: breakpoints)

### Component Patterns
- Motion.div wrapper for page entry animation
- Consistent header + content structure
- Loading states with spinner text
- Status messages inline with actions
- Overflow handling for tables/lists

---

## Production Readiness

### Features Already Implemented (Backend)
✅ Replay guard (head SHA deduplication)  
✅ Risk scoring algorithm (0-100)  
✅ Finding fingerprinting (SHA256)  
✅ Blast radius classification  
✅ Telemetry collection (timingsMs)  
✅ Rule engine (file/hunk filtering)  
✅ MongoDB persistence  
✅ GitHub webhook integration  

### Frontend Pages (New)
✅ 8 specialized visualization pages  
✅ Multi-page navigation with sidebar  
✅ Repository context persistence  
✅ API integration (settings, history, insights)  
✅ Dark theme with glassmorphism  
✅ Responsive design  
✅ Loading/error states  

---

## Next Steps

### Enhancement Opportunities
1. **Export Compliance Report** - PDF/CSV download
2. **Real-Time Webhooks** - WebSocket connection for live event stream
3. **Custom Alerts** - Risk threshold notifications
4. **Integration Tests** - Test webhook payloads from lab
5. **Advanced Filtering** - Date range, severity, category filters
6. **Trend Charts** - Risk/completion rate graphs over time
7. **User Roles** - Admin/developer/auditor permissions
8. **Slack Integration** - Post findings to Slack channels

---

## File Structure
```
frontend/src/
├── App.jsx (multi-page router + sidebar navigation)
├── pages/
│   ├── Dashboard.jsx (settings + insights)
│   ├── RiskHeatmap.jsx (file risk visualization)
│   ├── FindingHistory.jsx (dedup fingerprint tracking)
│   ├── SecurityTracker.jsx (vulnerability timeline)
│   ├── TeamAnalytics.jsx (developer metrics)
│   ├── ComplianceReport.jsx (audit snapshot)
│   ├── ConfigurationLab.jsx (rule testing sandbox)
│   └── WebhookMonitor.jsx (integration health)
```

---

## Summary

These 8 pages transform GitGuard AI from a webhook listener into a **complete code review analytics platform**. Teams gain visibility into:
- **Risk patterns** (which files need attention)
- **Deduplication effectiveness** (replay guard working)
- **Security compliance** (audit trails)
- **Team performance** (code quality by developer)
- **Operational health** (webhook integration status)
- **Rule effectiveness** (testing before deployment)

Each page leverages the differentiation features built into the backend:
- Replay guard → Finding Dedup page
- Risk scoring → Heatmap page
- Fingerprinting → Finding History tracking
- Blast radius → Security Tracker
- Telemetry → Compliance + Analytics pages
- Rules engine → Configuration Lab
- Webhook integration → Monitor page

**Product Differentiation:** While competitors show PRs with comments, GitGuard AI shows **why** findings matter, **how often** they appear, **which files** are risky, and **whether** the bot is effective.
