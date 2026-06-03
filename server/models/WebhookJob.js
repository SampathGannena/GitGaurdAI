const mongoose = require('mongoose');

const retentionSeconds = Number(process.env.WEBHOOK_JOB_RETENTION_SECONDS || 60 * 60 * 24 * 7);

const webhookJobSchema = new mongoose.Schema(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    event: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed'],
      default: 'queued',
      index: true,
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    nextRunAt: { type: Date, default: () => new Date(), index: true },
    startedAt: { type: Date },
    finishedAt: { type: Date },
    lastError: { type: String, default: '' },
    processingBy: { type: String, default: '' },
  },
  { timestamps: true }
);

webhookJobSchema.index({ status: 1, nextRunAt: 1, createdAt: 1 });
webhookJobSchema.index({ finishedAt: 1 }, { expireAfterSeconds: retentionSeconds });

module.exports = mongoose.model('WebhookJob', webhookJobSchema);
