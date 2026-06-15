const logger = require('../config/logger');
const WebhookJob = require('../models/WebhookJob');
const { processPullRequestEvent } = require('./webhookProcessor');

let workerStarted = false;
let inFlight = 0;
let pollTimer = null;
let stopping = false;
let lastStuckSweepAt = 0;
const concurrency = Number(process.env.WEBHOOK_QUEUE_CONCURRENCY || 2);
const pollMs = Number(process.env.WEBHOOK_QUEUE_POLL_MS || 1500);
const maxAttempts = Number(process.env.WEBHOOK_QUEUE_ATTEMPTS || 3);
const baseBackoffMs = Number(process.env.WEBHOOK_QUEUE_BACKOFF_MS || 1000);
const stuckJobMs = Number(process.env.WEBHOOK_QUEUE_STUCK_MS || 10 * 60 * 1000);

function buildJobId(payload) {
  const owner = payload?.repository?.owner?.login || 'unknown';
  const repo = payload?.repository?.name || 'unknown';
  const prNumber = payload?.number || 'unknown';
  const headSha = payload?.pull_request?.head?.sha || 'unknown-sha';
  return `${owner}/${repo}#${prNumber}:${headSha}`;
}

function computeBackoffMs(attempt) {
  return Math.max(0, baseBackoffMs * Math.pow(2, Math.max(0, attempt - 1)));
}

async function enqueuePullRequestJob(payload, event) {
  const jobId = buildJobId(payload);
  const now = new Date();

  let doc = await WebhookJob.findOneAndUpdate(
    { jobId },
    {
      $setOnInsert: {
        jobId,
        event,
        payload,
        status: 'queued',
        attempts: 0,
        maxAttempts,
        nextRunAt: now,
      },
    },
    { upsert: true, new: true }
  ).lean();

  if (doc?.status === 'failed') {
    await WebhookJob.updateOne(
      { _id: doc._id },
      {
        $set: { status: 'queued', nextRunAt: now, lastError: '' },
        $unset: { finishedAt: '' },
      }
    );
    doc = { ...doc, status: 'queued' };
  }

  scheduleDrainQueue();
  return { id: doc.jobId };
}

function startWebhookQueueWorker() {
  if (workerStarted) return;
  workerStarted = true;
  stopping = false;
  pollTimer = setInterval(scheduleDrainQueue, pollMs);
  scheduleDrainQueue();
}

async function stopWebhookQueueWorker({ timeoutMs = 5000 } = {}) {
  if (!workerStarted) return;
  stopping = true;
  workerStarted = false;
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }

  const startedAt = Date.now();
  while (inFlight > 0 && Date.now() - startedAt < timeoutMs) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (inFlight > 0) {
    logger.warn(`Webhook queue stopped with ${inFlight} job(s) still in flight`);
  } else {
    logger.info('Webhook queue stopped cleanly');
  }
}

async function drainQueue() {
  if (!workerStarted || stopping || inFlight >= concurrency) return;

  await sweepStuckJobs();

  while (inFlight < concurrency) {
    const now = new Date();
    const job = await WebhookJob.findOneAndUpdate(
      { status: 'queued', nextRunAt: { $lte: now } },
      {
        $set: {
          status: 'processing',
          startedAt: now,
          processingBy: String(process.pid),
        },
      },
      { sort: { nextRunAt: 1, createdAt: 1 }, new: true }
    ).lean();

    if (!job) return;

    inFlight += 1;
    handleJob(job).finally(() => {
      inFlight -= 1;
      setImmediate(scheduleDrainQueue);
    });
  }
}

function scheduleDrainQueue() {
  drainQueue().catch((err) => {
    logger.error(`Webhook queue polling failed: ${err.message || err}`);
  });
}

async function sweepStuckJobs() {
  if (!stuckJobMs || stuckJobMs <= 0) return;
  const now = Date.now();
  if (now - lastStuckSweepAt < pollMs) return;
  lastStuckSweepAt = now;

  const cutoff = new Date(now - stuckJobMs);
  const stuckJobs = await WebhookJob.find({
    status: 'processing',
    startedAt: { $lte: cutoff },
  })
    .sort({ startedAt: 1 })
    .limit(20)
    .lean();

  if (!stuckJobs.length) return;

  for (const job of stuckJobs) {
    const attempts = (job.attempts || 0) + 1;
    const shouldRetry = attempts < (job.maxAttempts || maxAttempts);
    const nextRunAt = new Date(Date.now() + computeBackoffMs(attempts));

    await WebhookJob.updateOne(
      { _id: job._id, status: 'processing' },
      {
        $set: {
          status: shouldRetry ? 'queued' : 'failed',
          attempts,
          nextRunAt,
          lastError: 'stuck_processing_timeout',
          processingBy: '',
          finishedAt: shouldRetry ? undefined : new Date(),
        },
        $unset: shouldRetry ? { finishedAt: '' } : {},
      }
    );

    logger.warn(`Requeued stuck job ${job.jobId} after ${stuckJobMs}ms`);
  }
}

async function handleJob(job) {
  try {
    await processPullRequestEvent(job.payload, job.event);
    await WebhookJob.updateOne(
      { _id: job._id },
      { $set: { status: 'completed', finishedAt: new Date(), lastError: '' } }
    );
    logger.info(`Webhook job ${job.jobId} completed`);
  } catch (err) {
    const attempts = (job.attempts || 0) + 1;
    const shouldRetry = attempts < (job.maxAttempts || maxAttempts);
    const nextRunAt = new Date(Date.now() + computeBackoffMs(attempts));

    await WebhookJob.updateOne(
      { _id: job._id },
      {
        $set: {
          status: shouldRetry ? 'queued' : 'failed',
          attempts,
          nextRunAt,
          lastError: String(err?.message || err),
          finishedAt: shouldRetry ? undefined : new Date(),
        },
        $unset: shouldRetry ? { finishedAt: '' } : {},
      }
    );
    logger.error(`Webhook job ${job.jobId} failed`, err.message || err);
  }
}

module.exports = {
  enqueuePullRequestJob,
  startWebhookQueueWorker,
  stopWebhookQueueWorker,
};
