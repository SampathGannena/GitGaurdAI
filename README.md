# GitGuard AI (Automated Pull Request Sentinel)

GitGuard AI is a production-ready, diff-focused AI code review system.
It listens to GitHub pull request webhooks, analyzes only changed hunks, and posts fix-first review comments back to the PR.

## Core Stack

- Backend: Node.js + Express + Mongoose
- Frontend: React + Tailwind + Framer Motion
- GitHub: Octokit REST API
- AI: Groq API (fast LLM inference)
- Database: MongoDB

## Implemented Product Capabilities

- Secure GitHub webhook listener with HMAC SHA256 verification
- Diff-only analysis pipeline (patch hunks, not full repo)
- Fix-first AI findings with corrected code blocks
- Team-specific rules engine per repository
- PR review comment bot with structured severity metadata
- Dashboard for settings, telemetry, and review history

## Differentiators Added Beyond Typical Tools

- Replay Guard: Prevents duplicate analysis for the same PR head SHA
- Risk Fingerprint: Deduplicates repeated findings using semantic fingerprints
- Blast-Radius Tagging: Classifies each finding as low/medium/high impact
- Latency Telemetry: Tracks fetch, LLM, comment, and total processing times
- Risk Analytics API: Provides rolling operational insights to dashboard

## Environment Variables

Copy `.env.example` to `.env` and set:

- `PORT=3000`
- `MONGODB_URI=mongodb://localhost:27017/gitguard`
- `GITHUB_TOKEN=...`
- `WEBHOOK_SECRET=...`
- `AUTH_JWT_SECRET=...` (Long random secret used to sign auth tokens)
- `GROQ_API_KEY=...` (Get from https://console.groq.com)
- `GROQ_MODEL=mixtral-8x7b-32768`

## Run Locally

```powershell
Set-Location "D:\GitGaurd Ai"
npm ci
npm run dev
```

In a separate terminal:

```powershell
Set-Location "D:\GitGaurd Ai\frontend"
npm ci
npm run dev
```

## Verification

```powershell
Set-Location "D:\GitGaurd Ai"
npm run check:server
npm test
```

## API Endpoints

- `POST /webhook`
  - Receives GitHub webhook events
  - Validates `x-hub-signature-256`
  - Handles `pull_request` actions: `opened`, `synchronize`, `reopened`
- `POST /auth/register`
  - Create user account and return auth token
- `POST /auth/login`
  - Sign in user and return auth token
- `GET /auth/me`
  - Validate token and return current user profile
- `GET /settings/:owner/:repo`
  - Get or initialize repo-level rules
- `PUT /settings/:owner/:repo`
  - Update repo-level rules
- `GET /settings/:owner/:repo/history?limit=20`
  - Fetch past review runs
- `GET /settings/:owner/:repo/insights`
  - Aggregate run health metrics

## GitHub Webhook Setup

1. Open repository -> Settings -> Webhooks -> Add webhook.
2. Payload URL: `https://<your-host>/webhook`.
3. Content type: `application/json`.
4. Secret: set to the same value as `WEBHOOK_SECRET`.
5. Event selection: choose `Pull requests` only.
6. Save and trigger by opening/updating a PR.

## Sample pull_request Payload Structure

Key fields used by GitGuard AI:

- `action`: `opened`, `synchronize`, `reopened`
- `number`: PR number
- `pull_request.title`: PR title
- `pull_request.user.login`: PR author
- `pull_request.head.sha`: commit SHA used by replay guard
- `repository.owner.login`: repo owner
- `repository.name`: repo name

Example payload shape:

```json
{
  "action": "opened",
  "number": 42,
  "pull_request": {
    "title": "Fix auth middleware edge case",
    "user": { "login": "octocat" },
    "head": { "sha": "abc123" }
  },
  "repository": {
    "name": "gitguard-ai",
    "owner": { "login": "acme" }
  }
}
```

## Week-wise Implementation Plan (Mapped)

- Week 1: Webhook listener and signature verification
  - Implemented in `server/routes/webhook.js`, `server/middleware/verifyGithubSignature.js`
- Week 2: Diff analyzer and AI pipeline
  - Implemented in `server/services/diffAnalyzer.js`, `server/services/aiService.js`
- Week 3: Comment bot loop
  - Implemented in `server/services/commentService.js`, `server/services/githubService.js`
- Week 4: Dashboard and settings/history
  - Implemented in `frontend/src/App.jsx`, `server/controllers/settingsController.js`

## Security Notes

- Keep `GITHUB_TOKEN`, `WEBHOOK_SECRET`, and `GROQ_API_KEY` in secure secret storage.
- Restrict webhook endpoint network access where possible.
- Rotate credentials periodically.
