# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.js >> authenticated smoke test covers primary pages
- Location: tests\smoke.spec.js:209:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Ship safer pull requests with an AI review loop.' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Ship safer pull requests with an AI review loop.' })

```

```yaml
- text: "[plugin:vite:esbuild] Transform failed with 1 error: C:/GitAi/GitGaurdAI/frontend/src/pages/Dashboard.jsx:524:26: ERROR: Expected \"}\" but found \"className\" C:/GitAi/GitGaurdAI/frontend/src/pages/Dashboard.jsx:524:26 Expected \"}\" but found \"className\" 522| className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${ 523| item.enabled 524| className=\"btn-scan\" | ^ 525| : \"bg-slate-400/15 text-slate-300\" 526| }`} at failureErrorWithLog (C:\\GitAi\\GitGaurdAI\\frontend\\node_modules\\esbuild\\lib\\main.js:1472:15) at C:\\GitAi\\GitGaurdAI\\frontend\\node_modules\\esbuild\\lib\\main.js:755:50 at responseCallbacks.<computed> (C:\\GitAi\\GitGaurdAI\\frontend\\node_modules\\esbuild\\lib\\main.js:622:9) at handleIncomingPacket (C:\\GitAi\\GitGaurdAI\\frontend\\node_modules\\esbuild\\lib\\main.js:677:12) at Socket.readFromStdout (C:\\GitAi\\GitGaurdAI\\frontend\\node_modules\\esbuild\\lib\\main.js:600:7) at Socket.emit (node:events:519:28) at addChunk (node:internal/streams/readable:561:12) at readableAddChunkPushByteMode (node:internal/streams/readable:512:3) at Readable.push (node:internal/streams/readable:392:5) at Pipe.onStreamRead (node:internal/stream_base_commons:189:23 Click outside, press Esc key, or fix the code to dismiss. You can also disable this overlay by setting"
- code: server.hmr.overlay
- text: to
- code: "false"
- text: in
- code: vite.config.js
- text: .
```

# Test source

```ts
  113 |       settings: {
  114 |         enabled: true,
  115 |         rules: {
  116 |           strictMode: false,
  117 |           ignoreLint: true,
  118 |           securityFirst: false,
  119 |           enableReplayGuard: true,
  120 |           enableRiskSummary: true,
  121 |           explanationTone: 'human',
  122 |           maxHunksPerPR: 20,
  123 |           maxCommentsPerPR: 10,
  124 |         },
  125 |       },
  126 |     });
  127 |   }
  128 | 
  129 |   if (path === '/settings/acme/gitguard/runs/42') {
  130 |     return json({
  131 |       ok: true,
  132 |       analysis: {
  133 |         prNumber: 42,
  134 |         prTitle: 'Test PR',
  135 |         prAuthor: 'octocat',
  136 |         status: 'completed',
  137 |         commentsPosted: 1,
  138 |         avgRiskScore: 10,
  139 |         filesChanged: 1,
  140 |         timingsMs: {
  141 |           prOpenToLlmResponse: 1200,
  142 |           fetchDiff: 200,
  143 |           llmAnalysis: 1000,
  144 |           commentPost: 400,
  145 |           total: 2400,
  146 |         },
  147 |         findings: [
  148 |           {
  149 |             title: 'Use strict equality',
  150 |             severity: 'low',
  151 |             category: 'correctness',
  152 |             filePath: 'src/app.js',
  153 |             fingerprint: 'fp1',
  154 |           },
  155 |         ],
  156 |       },
  157 |     });
  158 |   }
  159 | 
  160 |   if (path.startsWith('/chat/')) {
  161 |     if (route.request().method() === 'GET') {
  162 |       return json({
  163 |         ok: true,
  164 |         messages: [
  165 |           {
  166 |             _id: 'msg1',
  167 |             author: 'octocat',
  168 |             content: 'LGTM',
  169 |             createdAt: new Date().toISOString(),
  170 |             replies: [],
  171 |           },
  172 |         ],
  173 |       });
  174 |     }
  175 |     return json({ ok: true });
  176 |   }
  177 | 
  178 |   if (path.endsWith('/connect-github')) {
  179 |     return json({ ok: true, settings: { githubUsername: 'octocat' } });
  180 |   }
  181 | 
  182 |   if (path === '/settings/acme/gitguard/pulls/101/scan' || path === '/settings/acme/gitguard/pulls/55/scan') {
  183 |     return json({ ok: true, jobId: 'job-123', prNumber: path.includes('/101/') ? 101 : 55 });
  184 |   }
  185 | 
  186 |   return json({ ok: true });
  187 | }
  188 | 
  189 | async function enableAuth(page) {
  190 |   await page.addInitScript((tokenKey, userKey) => {
  191 |     window.localStorage.setItem(tokenKey, 'test-token');
  192 |     window.localStorage.setItem(
  193 |       userKey,
  194 |       JSON.stringify({ name: 'Test User', email: 'test@example.com' })
  195 |     );
  196 |   }, TOKEN_STORAGE_KEY, USER_STORAGE_KEY);
  197 | }
  198 | 
  199 | test.beforeEach(async ({ page }) => {
  200 |   await page.route(`${API_BASE}/**`, mockApi);
  201 | });
  202 | 
  203 | test('landing page renders for signed-out users', async ({ page }) => {
  204 |   await page.goto('/');
  205 |   await expect(page.getByRole('heading', { name: /Automated Code Review Powered by AI/i })).toBeVisible();
  206 |   await expect(page.getByRole('button', { name: /Get Started/i })).toBeVisible();
  207 | });
  208 | 
  209 | test('authenticated smoke test covers primary pages', async ({ page }) => {
  210 |   await enableAuth(page);
  211 |   await page.goto('/');
  212 | 
> 213 |   await expect(page.getByRole('heading', { name: 'Ship safer pull requests with an AI review loop.' })).toBeVisible();
      |                                                                                                         ^ Error: expect(locator).toBeVisible() failed
  214 | 
  215 |   const navigation = page.getByRole('navigation');
  216 | 
  217 |   await navigation.getByRole('button', { name: 'Risk Heatmap' }).click();
  218 |   await expect(page.getByRole('heading', { name: /Risk Heatmap/i })).toBeVisible();
  219 | 
  220 |   await navigation.getByRole('button', { name: 'Findings' }).click();
  221 |   await expect(page.getByRole('heading', { name: /Finding Deduplication/i })).toBeVisible();
  222 | 
  223 |   await navigation.getByRole('button', { name: 'Security' }).click();
  224 |   await expect(page.getByRole('heading', { name: /Security Vulnerability Tracker/i })).toBeVisible();
  225 | 
  226 |   await navigation.getByRole('button', { name: 'Team' }).click();
  227 |   await expect(page.getByRole('heading', { name: /Team Analytics/i })).toBeVisible();
  228 | 
  229 |   await navigation.getByRole('button', { name: 'Compliance' }).click();
  230 |   await expect(page.getByRole('heading', { name: /Compliance Report/i })).toBeVisible();
  231 | 
  232 |   await navigation.getByRole('button', { name: 'Webhook' }).click();
  233 |   await expect(page.getByRole('heading', { name: /Webhook Integration Monitor/i })).toBeVisible();
  234 | 
  235 |   await navigation.getByRole('button', { name: 'Lab' }).click();
  236 |   await expect(page.getByRole('heading', { name: /Configuration Lab/i })).toBeVisible();
  237 | 
  238 |   await navigation.getByRole('button', { name: 'Chat' }).click();
  239 |   await expect(page.getByRole('heading', { name: /Team Chat/i })).toBeVisible();
  240 | 
  241 |   await navigation.getByRole('button', { name: 'Dashboard' }).click();
  242 |   await expect(page.getByRole('heading', { name: 'Ship safer pull requests with an AI review loop.' })).toBeVisible();
  243 | 
  244 |   await page.locator('header').getByRole('button', { name: 'Settings' }).click();
  245 |   await expect(page.getByRole('heading', { name: /Review policy and limits/i })).toBeVisible();
  246 | 
  247 |   await navigation.getByRole('button', { name: 'Dashboard' }).click();
  248 |   await expect(page.getByRole('heading', { name: 'Ship safer pull requests with an AI review loop.' })).toBeVisible();
  249 | 
  250 |   await page.getByRole('button', { name: /Open PR analysis/i }).click();
  251 |   await expect(page.getByRole('heading', { name: /Inspect a completed AI review run/i })).toBeVisible();
  252 | });
  253 | 
```