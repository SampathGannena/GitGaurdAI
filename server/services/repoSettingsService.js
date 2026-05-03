const RepoSettings = require('../models/RepoSettings');

const DEFAULT_SETTINGS = {
  enabled: true,
  rules: {
    strictMode: false,
    ignoreLint: false,
    securityFirst: false,
    maxHunksPerPR: 80,
    maxCommentsPerPR: 20,
    enableReplayGuard: true,
    enableRiskSummary: true,
    explanationTone: 'human',
  },
};

async function getOrCreateRepoSettings({ owner, repo }) {
  let doc = await RepoSettings.findOne({ owner, repo }).lean();
  if (!doc) {
    const created = await RepoSettings.create({ owner, repo, ...DEFAULT_SETTINGS });
    doc = created.toObject();
  }

  return normalizeSettings(doc);
}

async function updateRepoSettings({ owner, repo, update }) {
  const doc = await RepoSettings.findOneAndUpdate(
    { owner, repo },
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  return normalizeSettings(doc);
}

function normalizeSettings(doc = {}) {
  return {
    owner: doc.owner,
    repo: doc.repo,
    enabled: doc.enabled ?? DEFAULT_SETTINGS.enabled,
    rules: {
      strictMode: doc.rules?.strictMode ?? DEFAULT_SETTINGS.rules.strictMode,
      ignoreLint: doc.rules?.ignoreLint ?? DEFAULT_SETTINGS.rules.ignoreLint,
      securityFirst: doc.rules?.securityFirst ?? DEFAULT_SETTINGS.rules.securityFirst,
      maxHunksPerPR: doc.rules?.maxHunksPerPR ?? DEFAULT_SETTINGS.rules.maxHunksPerPR,
      maxCommentsPerPR: doc.rules?.maxCommentsPerPR ?? DEFAULT_SETTINGS.rules.maxCommentsPerPR,
      enableReplayGuard: doc.rules?.enableReplayGuard ?? DEFAULT_SETTINGS.rules.enableReplayGuard,
      enableRiskSummary: doc.rules?.enableRiskSummary ?? DEFAULT_SETTINGS.rules.enableRiskSummary,
      explanationTone: doc.rules?.explanationTone ?? DEFAULT_SETTINGS.rules.explanationTone,
    },
  };
}

module.exports = {
  getOrCreateRepoSettings,
  updateRepoSettings,
  normalizeSettings,
};
