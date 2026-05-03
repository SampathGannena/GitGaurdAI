const mongoose = require('mongoose');

const rulesSchema = new mongoose.Schema(
  {
    strictMode: { type: Boolean, default: false },
    ignoreLint: { type: Boolean, default: false },
    securityFirst: { type: Boolean, default: false },
    maxHunksPerPR: { type: Number, min: 1, max: 500, default: 80 },
    maxCommentsPerPR: { type: Number, min: 1, max: 200, default: 20 },
    enableReplayGuard: { type: Boolean, default: true },
    enableRiskSummary: { type: Boolean, default: true },
    explanationTone: {
      type: String,
      enum: ['human', 'concise', 'detailed'],
      default: 'human',
    },
  },
  { _id: false }
);

const repoSettingsSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true, trim: true },
    repo: { type: String, required: true, trim: true },
    rules: { type: rulesSchema, default: () => ({}) },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

repoSettingsSchema.index({ owner: 1, repo: 1 }, { unique: true });

module.exports = mongoose.model('RepoSettings', repoSettingsSchema);
