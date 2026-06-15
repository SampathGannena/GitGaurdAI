const { test, expect } = require('@playwright/test');

const TOKEN_STORAGE_KEY = 'gitguard_auth_token';
const USER_STORAGE_KEY = 'gitguard_auth_user';
const API_BASE = 'http://localhost:3000';

function mockApi(route) {
  const url = new URL(route.request().url());
  const path = url.pathname;

  const json = (data) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });

  if (path === '/auth/me') {
    return json({ ok: true, user: { name: 'Test User', email: 'test@example.com' } });
  }

  if (path === '/auth/github/status') {
    return json({ ok: true, github: { connected: true, username: 'octocat' } });
  }

  if (path === '/settings/repositories') {
    return json({ ok: true, repositories: [{ owner: 'acme', repo: 'gitguard' }] });
  }

  if (path === '/settings/acme/gitguard/history') {
    return json({
      ok: true,
      history: [
        {
          prNumber: 42,
          headSha: 'abc123',
          prTitle: 'Test PR',
          prAuthor: 'octocat',
          status: 'completed',
          commentsPosted: 1,
          timingsMs: { llmAnalysis: 1200, total: 2400 },
          findings: [
            {
              title: 'Use strict equality',
              severity: 'low',
              category: 'correctness',
              filePath: 'src/app.js',
              fingerprint: 'fp1',
              riskScore: 10,
              blastRadius: 'low',
            },
          ],
        },
      ],
    });
  }

  if (path === '/settings/acme/gitguard/insights') {
    return json({
      ok: true,
      insights: {
        totalRuns: 1,
        completedRuns: 1,
        failedRuns: 0,
        skippedRuns: 0,
        avgTotalMs: 2400,
        avgRiskScore: 10,
      },
    });
  }

  if (path === '/settings/acme/gitguard/pulls' && url.searchParams.get('state') === 'open') {
    return json({
      ok: true,
      pullRequests: [
        {
          number: 101,
          title: 'Add webhook queue resilience',
          user: 'octocat',
          updatedAt: new Date().toISOString(),
          url: 'https://github.com/acme/gitguard/pull/101',
        },
      ],
    });
  }

  if (path === '/settings/acme/gitguard/pulls' && url.searchParams.get('state') === 'closed') {
    return json({
      ok: true,
      pullRequests: [
        {
          number: 55,
          title: 'Fix webhook timeout retries',
          user: 'octocat',
          updatedAt: new Date().toISOString(),
          url: 'https://github.com/acme/gitguard/pull/55',
        },
      ],
    });
  }

  if (path === '/settings/acme/gitguard/github-status') {
    return json({
      ok: true,
      github: { connected: true, username: 'octocat' },
      repo: { linked: true, linkedUsername: 'octocat' },
    });
  }

  if (path === '/settings/acme/gitguard') {
    return json({
      ok: true,
      settings: {
        enabled: true,
        rules: {
          strictMode: false,
          ignoreLint: true,
          securityFirst: false,
          enableReplayGuard: true,
          enableRiskSummary: true,
          explanationTone: 'human',
          maxHunksPerPR: 20,
          maxCommentsPerPR: 10,
        },
      },
    });
  }

  if (path === '/settings/acme/gitguard/runs/42') {
    return json({
      ok: true,
      analysis: {
        prNumber: 42,
        prTitle: 'Test PR',
        prAuthor: 'octocat',
        status: 'completed',
        commentsPosted: 1,
        avgRiskScore: 10,
        filesChanged: 1,
        timingsMs: {
          prOpenToLlmResponse: 1200,
          fetchDiff: 200,
          llmAnalysis: 1000,
          commentPost: 400,
          total: 2400,
        },
        findings: [
          {
            title: 'Use strict equality',
            severity: 'low',
            category: 'correctness',
            filePath: 'src/app.js',
            fingerprint: 'fp1',
          },
        ],
      },
    });
  }

  if (path.startsWith('/chat/')) {
    if (route.request().method() === 'GET') {
      return json({
        ok: true,
        messages: [
          {
            _id: 'msg1',
            author: 'octocat',
            content: 'LGTM',
            createdAt: new Date().toISOString(),
            replies: [],
          },
        ],
      });
    }
    return json({ ok: true });
  }

  if (path.endsWith('/connect-github')) {
    return json({ ok: true, settings: { githubUsername: 'octocat' } });
  }

  if (path === '/settings/acme/gitguard/pulls/101/scan' || path === '/settings/acme/gitguard/pulls/55/scan') {
    return json({ ok: true, jobId: 'job-123', prNumber: path.includes('/101/') ? 101 : 55 });
  }

  return json({ ok: true });
}

async function enableAuth(page) {
  await page.addInitScript((tokenKey, userKey) => {
    window.localStorage.setItem(tokenKey, 'test-token');
    window.localStorage.setItem(
      userKey,
      JSON.stringify({ name: 'Test User', email: 'test@example.com' })
    );
  }, TOKEN_STORAGE_KEY, USER_STORAGE_KEY);
}

test.beforeEach(async ({ page }) => {
  await page.route(`${API_BASE}/**`, mockApi);
});

test('landing page renders for signed-out users', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Automated Code Review Powered by AI/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Get Started/i })).toBeVisible();
});

test('authenticated smoke test covers primary pages', async ({ page }) => {
  await enableAuth(page);
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Ship safer pull requests with an AI review loop.' })).toBeVisible();

  const navigation = page.getByRole('navigation');

  await navigation.getByRole('button', { name: 'Risk Heatmap' }).click();
  await expect(page.getByRole('heading', { name: /Risk Heatmap/i })).toBeVisible();

  await navigation.getByRole('button', { name: 'Findings' }).click();
  await expect(page.getByRole('heading', { name: /Finding Deduplication/i })).toBeVisible();

  await navigation.getByRole('button', { name: 'Security' }).click();
  await expect(page.getByRole('heading', { name: /Security Vulnerability Tracker/i })).toBeVisible();

  await navigation.getByRole('button', { name: 'Team' }).click();
  await expect(page.getByRole('heading', { name: /Team Analytics/i })).toBeVisible();

  await navigation.getByRole('button', { name: 'Compliance' }).click();
  await expect(page.getByRole('heading', { name: /Compliance Report/i })).toBeVisible();

  await navigation.getByRole('button', { name: 'Lab' }).click();
  await expect(page.getByRole('heading', { name: /Configuration Lab/i })).toBeVisible();

  await navigation.getByRole('button', { name: 'AI Assist' }).click();
  await expect(page.getByRole('heading', { name: /AI Assistance/i })).toBeVisible();

  await navigation.getByRole('button', { name: 'Dashboard' }).click();
  await expect(page.getByRole('heading', { name: 'Ship safer pull requests with an AI review loop.' })).toBeVisible();

  await page.locator('header').getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: /Review policy and limits/i })).toBeVisible();

  await navigation.getByRole('button', { name: 'Dashboard' }).click();
  await expect(page.getByRole('heading', { name: 'Ship safer pull requests with an AI review loop.' })).toBeVisible();

  await page.getByRole('button', { name: /Open PR analysis/i }).click();
  await expect(page.getByRole('heading', { name: /Inspect a completed AI review run/i })).toBeVisible();
});
