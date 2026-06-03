const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

function mockModule(modulePath, exports) {
  const resolved = require.resolve(modulePath);
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports,
  };
}

function resetModule(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
}

function buildPullRequestPayload({ installationId = 123 } = {}) {
  return {
    action: 'opened',
    number: 42,
    installation: { id: installationId },
    pull_request: {
      title: 'Test PR',
      user: { login: 'octocat' },
      head: { sha: 'abc123' },
      created_at: new Date().toISOString(),
    },
    repository: {
      name: 'gitguard',
      owner: { login: 'acme' },
    },
  };
}

function buildRawDiff() {
  return [
    'diff --git a/src/app.js b/src/app.js',
    'index 1111111..2222222 100644',
    '--- a/src/app.js',
    '+++ b/src/app.js',
    '@@ -1,2 +1,3 @@',
    ' const x = 1;',
    '+const y = 2;',
    ' module.exports = x;',
  ].join('\n');
}

test('processPullRequestEvent posts review once and stores review id', async () => {
  const githubServicePath = path.resolve(__dirname, '../server/services/githubService.js');
  const aiServicePath = path.resolve(__dirname, '../server/services/aiService.js');
  const commentServicePath = path.resolve(__dirname, '../server/services/commentService.js');
  const reviewRunServicePath = path.resolve(__dirname, '../server/services/reviewRunService.js');
  const repoSettingsServicePath = path.resolve(__dirname, '../server/services/repoSettingsService.js');

  resetModule(githubServicePath);
  resetModule(aiServicePath);
  resetModule(commentServicePath);
  resetModule(reviewRunServicePath);
  resetModule(repoSettingsServicePath);
  resetModule(path.resolve(__dirname, '../server/services/webhookProcessor.js'));

  const calls = {
    createReview: 0,
    setReviewId: 0,
    completeRun: 0,
  };

  mockModule(githubServicePath, {
    fetchPullRequestDiff: async () => buildRawDiff(),
  });

  mockModule(aiServicePath, {
    analyzeHunk: async () => ({
      title: 'Use strict equality',
      severity: 'low',
      category: 'correctness',
      confidence: 0.8,
      suggestion: '```js\nif (a === b) {\n}\n```',
      explanation: '- Use strict equality',
    }),
  });

  mockModule(commentServicePath, {
    postComments: async () => {
      calls.createReview += 1;
      return 999;
    },
  });

  mockModule(reviewRunServicePath, {
    hasProcessedHeadSha: async () => false,
    startRun: async () => ({ reviewId: null }),
    setReviewId: async () => {
      calls.setReviewId += 1;
    },
    completeRun: async () => {
      calls.completeRun += 1;
    },
    failRun: async () => {},
    skipRun: async () => {},
  });

  mockModule(repoSettingsServicePath, {
    getOrCreateRepoSettings: async () => ({
      enabled: true,
      installationId: 123,
      rules: {
        strictMode: false,
        ignoreLint: false,
        securityFirst: false,
        maxHunksPerPR: 10,
        maxCommentsPerPR: 5,
        enableReplayGuard: false,
      },
    }),
    updateRepoSettings: async () => {},
  });

  const { processPullRequestEvent } = require('../server/services/webhookProcessor');
  await processPullRequestEvent(buildPullRequestPayload(), 'pull_request');

  assert.equal(calls.createReview, 1);
  assert.equal(calls.setReviewId, 1);
  assert.equal(calls.completeRun, 1);
});

test('processPullRequestEvent skips oversized diffs', async () => {
  const githubServicePath = path.resolve(__dirname, '../server/services/githubService.js');
  const aiServicePath = path.resolve(__dirname, '../server/services/aiService.js');
  const commentServicePath = path.resolve(__dirname, '../server/services/commentService.js');
  const reviewRunServicePath = path.resolve(__dirname, '../server/services/reviewRunService.js');
  const repoSettingsServicePath = path.resolve(__dirname, '../server/services/repoSettingsService.js');

  resetModule(githubServicePath);
  resetModule(aiServicePath);
  resetModule(commentServicePath);
  resetModule(reviewRunServicePath);
  resetModule(repoSettingsServicePath);
  resetModule(path.resolve(__dirname, '../server/services/webhookProcessor.js'));

  const calls = {
    comment: 0,
    failRun: 0,
  };

  mockModule(githubServicePath, {
    fetchPullRequestDiff: async () => 'x'.repeat(50),
  });

  mockModule(aiServicePath, {
    analyzeHunk: async () => null,
  });

  mockModule(commentServicePath, {
    postComments: async () => {
      calls.comment += 1;
    },
  });

  mockModule(reviewRunServicePath, {
    hasProcessedHeadSha: async () => false,
    startRun: async () => ({ reviewId: null }),
    setReviewId: async () => {},
    completeRun: async () => {},
    failRun: async () => {
      calls.failRun += 1;
    },
    skipRun: async () => {},
  });

  mockModule(repoSettingsServicePath, {
    getOrCreateRepoSettings: async () => ({
      enabled: true,
      installationId: 123,
      rules: {
        strictMode: false,
        ignoreLint: false,
        securityFirst: false,
        maxHunksPerPR: 10,
        maxCommentsPerPR: 5,
        enableReplayGuard: false,
      },
    }),
    updateRepoSettings: async () => {},
  });

  process.env.WEBHOOK_MAX_DIFF_CHARS = '10';
  const { processPullRequestEvent } = require('../server/services/webhookProcessor');
  await processPullRequestEvent(buildPullRequestPayload(), 'pull_request');
  delete process.env.WEBHOOK_MAX_DIFF_CHARS;

  assert.equal(calls.failRun, 1);
  assert.equal(calls.comment, 0);
});

test('job queue processes a queued webhook job', async () => {
  const webhookJobPath = path.resolve(__dirname, '../server/models/WebhookJob.js');
  const webhookProcessorPath = path.resolve(__dirname, '../server/services/webhookProcessor.js');
  const jobQueuePath = path.resolve(__dirname, '../server/services/jobQueue.js');

  resetModule(webhookJobPath);
  resetModule(webhookProcessorPath);
  resetModule(jobQueuePath);

  const jobs = [];

  function findIndexById(id) {
    return jobs.findIndex(job => String(job._id) === String(id));
  }

  function wrapLean(value) {
    return {
      lean: async () => value,
    };
  }

  function chainableFind(results) {
    return {
      sort: () => ({
        limit: () => ({
          lean: async () => results,
        }),
      }),
      limit: () => ({
        lean: async () => results,
      }),
      lean: async () => results,
    };
  }

  mockModule(webhookJobPath, {
    findOneAndUpdate: (query, update, options) => {
      if (query.jobId) {
        const existing = jobs.find(job => job.jobId === query.jobId);
        if (existing) {
          return wrapLean({ ...existing });
        }
        const doc = {
          _id: String(jobs.length + 1),
          jobId: update.$setOnInsert.jobId,
          event: update.$setOnInsert.event,
          payload: update.$setOnInsert.payload,
          status: update.$setOnInsert.status,
          attempts: update.$setOnInsert.attempts,
          maxAttempts: update.$setOnInsert.maxAttempts,
          nextRunAt: update.$setOnInsert.nextRunAt,
          createdAt: new Date(),
          startedAt: null,
        };
        jobs.push(doc);
        return wrapLean(options?.new ? { ...doc } : null);
      }

      const now = query.nextRunAt?.$lte || new Date();
      const candidate = jobs.find(job => job.status === 'queued' && job.nextRunAt <= now);
      if (!candidate) return wrapLean(null);

      candidate.status = update.$set.status;
      candidate.startedAt = update.$set.startedAt;
      candidate.processingBy = update.$set.processingBy;
      return wrapLean(options?.new ? { ...candidate } : null);
    },
    updateOne: async (query, update) => {
      const idx = findIndexById(query._id);
      if (idx === -1) return null;
      jobs[idx] = {
        ...jobs[idx],
        ...update.$set,
      };
      if (update.$unset?.finishedAt) {
        delete jobs[idx].finishedAt;
      }
      return null;
    },
    find: (query) => {
      if (!query || !query.status) {
        return chainableFind([]);
      }
      const status = query.status;
      const cutoff = query.startedAt?.$lte;
      const filtered = jobs.filter(job => {
        if (job.status !== status) return false;
        if (cutoff && job.startedAt && job.startedAt > cutoff) return false;
        return true;
      });
      return chainableFind(filtered);
    },
  });

  const processed = { count: 0 };
  mockModule(webhookProcessorPath, {
    processPullRequestEvent: async () => {
      processed.count += 1;
    },
  });

  process.env.WEBHOOK_QUEUE_POLL_MS = '10';
  process.env.WEBHOOK_QUEUE_CONCURRENCY = '1';

  const jobQueue = require('../server/services/jobQueue');
  await jobQueue.enqueuePullRequestJob(buildPullRequestPayload(), 'pull_request');
  jobQueue.startWebhookQueueWorker();

  await new Promise(resolve => setTimeout(resolve, 50));

  await jobQueue.stopWebhookQueueWorker({ timeoutMs: 1000 });
  delete process.env.WEBHOOK_QUEUE_POLL_MS;
  delete process.env.WEBHOOK_QUEUE_CONCURRENCY;

  assert.equal(processed.count, 1);
});
