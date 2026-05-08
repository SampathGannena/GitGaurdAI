const mongoose = require('mongoose');

const findingSchema = new mongoose.Schema(
  {
    filePath: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    category: { type: String, default: 'correctness' },
    confidence: { type: Number, min: 0, max: 1, default: 0.5 },
    title: { type: String, default: '' },
    explanation: { type: String, default: '' },
    suggestion: { type: String, default: '' },
    riskScore: { type: Number, min: 0, max: 100, default: 0 },
    blastRadius: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    fingerprint: { type: String, default: '' },
  },
  { _id: false }
);

const reviewRunSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true, index: true },
    repo: { type: String, required: true, index: true },
    prNumber: { type: Number, required: true, index: true },
    action: { type: String, required: true },
    headSha: { type: String, required: true, index: true },
    prTitle: { type: String, default: '' },
    prAuthor: { type: String, default: '' },
    prOpenedAt: { type: Date },
    llmCompletedAt: { type: Date },
    status: { type: String, enum: ['processing', 'completed', 'failed', 'skipped'], default: 'processing' },
    skippedReason: { type: String, default: '' },
    timingsMs: {
      prOpenToLlmResponse: { type: Number, default: 0 },
      fetchDiff: { type: Number, default: 0 },
      llmAnalysis: { type: Number, default: 0 },
      commentPost: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    filesChanged: { type: Number, default: 0 },
    hunksAnalyzed: { type: Number, default: 0 },
    commentsPosted: { type: Number, default: 0 },
    avgRiskScore: { type: Number, default: 0 },
    findings: { type: [findingSchema], default: [] },
  },
  { timestamps: true }
);

reviewRunSchema.index({ owner: 1, repo: 1, prNumber: 1, headSha: 1 }, { unique: true });

module.exports = mongoose.model('ReviewRun', reviewRunSchema);
