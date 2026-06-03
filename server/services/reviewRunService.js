const ReviewRun = require("../models/ReviewRun");

async function hasProcessedHeadSha({ owner, repo, prNumber, headSha }) {
  const existing = await ReviewRun.findOne({
    owner,
    repo,
    prNumber,
    headSha,
  }).lean();
  if (!existing) return false;

  if (existing.status === "processing") {
    const staleMs = Number(process.env.REVIEW_RUN_STUCK_MS || 15 * 60 * 1000);
    if (staleMs > 0 && existing.updatedAt) {
      const ageMs = Date.now() - new Date(existing.updatedAt).getTime();
      if (ageMs > staleMs) {
        await ReviewRun.updateOne(
          { _id: existing._id },
          { $set: { status: "failed", skippedReason: "stale_processing_timeout" } },
        );
        return false;
      }
    }
  }

  return Boolean(["processing", "completed", "skipped"].includes(existing.status));
}

async function startRun({
  owner,
  repo,
  prNumber,
  action,
  headSha,
  prTitle,
  prAuthor,
  prOpenedAt,
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
        prOpenedAt,
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

async function setReviewId({ owner, repo, prNumber, headSha, reviewId }) {
  return ReviewRun.findOneAndUpdate(
    { owner, repo, prNumber, headSha },
    { $set: { reviewId } },
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
  setReviewId,
  getRepoHistory,
  getPRRun,
};
