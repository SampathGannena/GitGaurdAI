const WebhookJob = require('../models/WebhookJob');
const ReviewRun = require('../models/ReviewRun');

function getManualRetentionMs() {
  const seconds = Number(process.env.WEBHOOK_JOB_MANUAL_RETENTION_SECONDS || 60 * 60 * 24 * 7);
  return Math.max(0, seconds * 1000);
}

async function getQueueMetrics(req, res, next) {
  try {
    const lookbackHours = Number(process.env.WEBHOOK_METRICS_LOOKBACK_HOURS || 24);
    const fromDate = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);
    const counts = await WebhookJob.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const byStatus = { queued: 0, processing: 0, completed: 0, failed: 0 };
    counts.forEach((row) => {
      if (row && row._id) {
        byStatus[row._id] = row.count;
      }
    });

    const recentFailures = await WebhookJob.find({ status: 'failed' })
      .sort({ finishedAt: -1 })
      .limit(10)
      .select('jobId lastError attempts finishedAt')
      .lean();

    const oldestQueued = await WebhookJob.find({ status: 'queued' })
      .sort({ nextRunAt: 1 })
      .limit(1)
      .select('jobId nextRunAt attempts')
      .lean();

    const runSummary = await ReviewRun.aggregate([
      { $match: { createdAt: { $gte: fromDate } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgLlmMs: { $avg: '$timingsMs.llmAnalysis' },
          avgTotalMs: { $avg: '$timingsMs.total' },
          avgCommentMs: { $avg: '$timingsMs.commentPost' },
        },
      },
    ]);

    const runMetrics = {
      lookbackHours,
      counts: { processing: 0, completed: 0, failed: 0, skipped: 0 },
      avgLlmMs: 0,
      avgTotalMs: 0,
      avgCommentMs: 0,
    };

    let completedCount = 0;
    runSummary.forEach((row) => {
      if (row && row._id) {
        runMetrics.counts[row._id] = row.count;
        if (row._id === 'completed') {
          completedCount = row.count || 0;
          runMetrics.avgLlmMs = Number((row.avgLlmMs || 0).toFixed(2));
          runMetrics.avgTotalMs = Number((row.avgTotalMs || 0).toFixed(2));
          runMetrics.avgCommentMs = Number((row.avgCommentMs || 0).toFixed(2));
        }
      }
    });

    res.json({
      ok: true,
      metrics: {
        counts: byStatus,
        oldestQueued: oldestQueued[0] || null,
        recentFailures,
        reviewRuns: runMetrics,
        completedRunsInWindow: completedCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function cleanupOldJobs(req, res, next) {
  try {
    const retentionOverride = Number(req.query.retentionSeconds);
    const beforeOverride = req.query.before ? new Date(req.query.before) : null;

    if (req.query.retentionSeconds && (!Number.isFinite(retentionOverride) || retentionOverride < 0)) {
      return res.status(400).json({ ok: false, message: 'retentionSeconds must be a non-negative number' });
    }

    if (beforeOverride && Number.isNaN(beforeOverride.getTime())) {
      return res.status(400).json({ ok: false, message: 'before must be a valid date string' });
    }

    const retentionMs = Number.isFinite(retentionOverride)
      ? retentionOverride * 1000
      : getManualRetentionMs();
    const cutoff = beforeOverride || new Date(Date.now() - retentionMs);
    const result = await WebhookJob.deleteMany({
      status: { $in: ['completed', 'failed'] },
      finishedAt: { $lte: cutoff },
    });

    res.json({
      ok: true,
      deletedCount: result.deletedCount || 0,
      cutoff,
      retentionSeconds: Number.isFinite(retentionOverride) ? retentionOverride : undefined,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getQueueMetrics, cleanupOldJobs };
