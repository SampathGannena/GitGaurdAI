const ReviewRun = require("../models/ReviewRun");

async function hasProcessedHeadSha({ owner, repo, prNumber, headSha }) {
  const existing = await ReviewRun.findOne({
    owner,
    repo,
    prNumber,
    headSha,
  }).lean();
  return Boolean(
    existing &&
    ["processing", "completed", "skipped"].includes(existing.status),
  );
}

async function startRun({
  owner,
  repo,
  prNumber,
  action,
  headSha,
  prTitle,
  prAuthor,
}) {
  return ReviewRun.findOneAndUpdate(
    { owner, repo, prNumber, headSha },
    {
      $setOnInsert: {
        owner,
        repo,
        prNumber,
        action,
        headSha,
        prTitle,
        prAuthor,
      },
      $set: { status: "processing", skippedReason: "" },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

async function completeRun({ owner, repo, prNumber, headSha, payload }) {
  return ReviewRun.findOneAndUpdate(
    { owner, repo, prNumber, headSha },
    { $set: { status: "completed", ...payload } },
    { new: true },
  );
}

async function skipRun({ owner, repo, prNumber, headSha, reason }) {
  return ReviewRun.findOneAndUpdate(
    { owner, repo, prNumber, headSha },
    {
      $setOnInsert: { owner, repo, prNumber, headSha },
      $set: { status: "skipped", skippedReason: reason },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

async function failRun({
  owner,
  repo,
  prNumber,
  headSha,
  errorMessage,
  timingsMs,
}) {
  return ReviewRun.findOneAndUpdate(
    { owner, repo, prNumber, headSha },
    { $set: { status: "failed", skippedReason: errorMessage, timingsMs } },
    { new: true },
  );
}

async function getRepoHistory({ owner, repo, limit = 30 }) {
  return ReviewRun.find({ owner, repo })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

async function getPRRun({ owner, repo, prNumber }) {
  return ReviewRun.findOne({ owner, repo, prNumber }).lean();
}

module.exports = {
  hasProcessedHeadSha,
  startRun,
  completeRun,
  skipRun,
  failRun,
  getRepoHistory,
  getPRRun,
};
