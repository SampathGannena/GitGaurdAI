# GitGuard AI - Frontend Quick Start

## 8 Unique Dashboard Pages

| Page | Icon | Purpose | Key Metric |
|------|------|---------|-----------|
| **Dashboard** | ⚙️ | Settings hub + overview | Live insights |
| **Risk Heatmap** | 🔥 | File risk distribution | Risk score 0-100 |
| **Finding Dedup** | 🔄 | Replay guard effectiveness | Fingerprint tracking |
| **Security Tracker** | 🔒 | Vulnerability timeline | Critical issues |
| **Team Analytics** | 📊 | Developer code quality | Issues/PR ratio |
| **Compliance Report** | 📋 | Audit-ready snapshot | Pass/Review status |
| **Config Lab** | 🧪 | Test rule combinations | Predicted output |
| **Webhook Monitor** | 🔗 | Integration health | Uptime/API quota |

## Running the Frontend

### Prerequisites
- Node.js 18+
- Backend running on `http://localhost:3000`

### Start Dev Server
```bash
cd frontend
npm install
npm run dev
```

The app runs on port 5173 with live reloads.

### Navigate Pages
1. Enter owner/repo in Dashboard
2. Click page names in left sidebar
3. Each page loads data independently

## Key Features

### Differentiators Visualized
- **Replay Guard** → Finding Dedup page shows deduplication happening
- **Risk Scoring** → Heatmap shows 0-100 risk distribution by file
- **Fingerprinting** → Tracks same issues appearing across PRs
- **Blast Radius** → Security Tracker shows impact classification
- **Telemetry** → Compliance/Analytics show processing metrics

### API Calls (All Made Automatically)
```javascript
// Each page calls these endpoints:
GET  /settings/{owner}/{repo}              // Load settings
PUT  /settings/{owner}/{repo}              // Save settings
GET  /settings/{owner}/{repo}/history?limit=50  // Review history
GET  /settings/{owner}/{repo}/insights     // Aggregate metrics
```

## Component Architecture

```
App.jsx (router + sidebar navigation)
├── Dashboard (settings CRUD + home view)
├── RiskHeatmap (file risk color-coded)
├── FindingHistory (fingerprint dedup tracking)
├── SecurityTracker (vulnerability timeline)
├── TeamAnalytics (developer metrics table)
├── ComplianceReport (compliance snapshot)
├── ConfigurationLab (rule simulation sandbox)
└── WebhookMonitor (integration health checks)
```

## Styling

- **Framework:** Tailwind CSS 3.5.2
- **Animation:** Framer Motion 10.12.16
- **Theme:** Dark mode (zinc-950/slate-900)
- **Accents:** Violet (600/500), Cyan (300), Emerald (300)
- **Effects:** Glassmorphism (white/5 + backdrop-blur)

## State Management

### Global State (App.jsx)
- `currentPage` - Active page ID
- `owner` - GitHub owner (persists across pages)
- `repo` - Repository name (persists across pages)

### Local State (Each Page)
- Page-specific data fetching
- Loading/error states
- User input handling

## Performance Notes

- **Heatmap:** Loads last 50 reviews, groups by file
- **Security Tracker:** Filters category='security', sorts by timestamp
- **Team Analytics:** Groups findings by PR author, counts by severity
- **Compliance:** Runs once, caches until manual refresh

## Troubleshooting

### Pages Show "No Data Yet"
- Ensure backend is running on port 3000
- Click "Load History" on Dashboard first
- Backend needs MongoDB with review runs

### API Calls Fail
- Check backend at `http://localhost:3000/settings/test/test`
- Verify CORS is enabled (Helmet should allow it)
- Check browser console for error details

### Styling Looks Broken
- Run `npm run build` to check for CSS minifier issues
- Verify Tailwind config is present
- Check for conflicting CSS in styles.css

## File Tree

```
frontend/
├── src/
│   ├── App.jsx               (8-page router + sidebar)
│   ├── main.jsx              (React entry point)
│   ├── styles.css            (Tailwind styles)
│   └── pages/
│       ├── Dashboard.jsx     (settings hub)
│       ├── RiskHeatmap.jsx   (risk visualization)
│       ├── FindingHistory.jsx (dedup tracking)
│       ├── SecurityTracker.jsx (timeline)
│       ├── TeamAnalytics.jsx (metrics)
│       ├── ComplianceReport.jsx (audit snapshot)
│       ├── ConfigurationLab.jsx (testing sandbox)
│       └── WebhookMonitor.jsx (health checks)
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Production Checklist

- [ ] Backend running and accessible
- [ ] MongoDB populated with review runs
- [ ] All 8 pages render without console errors
- [ ] API endpoints respond correctly
- [ ] Sidebar navigation works smoothly
- [ ] Page transitions animate properly
- [ ] Dark theme displays correctly
- [ ] Responsive layout on mobile

## Next Enhancements

1. Add real-time WebSocket updates to Webhook Monitor
2. Export Compliance Report as PDF
3. Add date-range filtering to all pages
4. Implement user authentication (GitHub OAuth)
5. Add Slack/email notifications from alerts
6. Create trend charts with historical data
7. Add search/filter to finding history
8. Integrate with GitHub Deployments API
