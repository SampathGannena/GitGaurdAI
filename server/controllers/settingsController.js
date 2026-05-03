const repoSettingsService = require("../services/repoSettingsService");
const reviewRunService = require("../services/reviewRunService");

async function getRepoSettings(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const settings = await repoSettingsService.getOrCreateRepoSettings({
      owner,
      repo,
    });
    res.json({ ok: true, settings });
  } catch (err) {
    next(err);
  }
}

async function upsertRepoSettings(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const body = req.body || {};
    const update = {
      enabled: body.enabled,
      rules: body.rules,
    };

    Object.keys(update).forEach(
      (k) => update[k] === undefined && delete update[k],
    );

    const settings = await repoSettingsService.updateRepoSettings({
      owner,
      repo,
      update,
    });
    res.json({ ok: true, settings });
  } catch (err) {
    next(err);
  }
}

async function getRepoHistory(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const limit = Number(req.query.limit || 30);
    const history = await reviewRunService.getRepoHistory({
      owner,
      repo,
      limit: Math.min(100, Math.max(1, limit)),
    });
    res.json({ ok: true, history });
  } catch (err) {
    next(err);
  }
}

async function getRepoInsights(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const history = await reviewRunService.getRepoHistory({
      owner,
      repo,
      limit: 50,
    });

    const completed = history.filter((h) => h.status === "completed");
    const avgTotalMs = completed.length
      ? Number(
          (
            completed.reduce(
              (acc, run) => acc + (run.timingsMs?.total || 0),
              0,
            ) / completed.length
          ).toFixed(2),
        )
      : 0;
    const avgRiskScore = completed.length
      ? Number(
          (
            completed.reduce((acc, run) => acc + (run.avgRiskScore || 0), 0) /
            completed.length
          ).toFixed(2),
        )
      : 0;

    res.json({
      ok: true,
      insights: {
        totalRuns: history.length,
        completedRuns: completed.length,
        failedRuns: history.filter((h) => h.status === "failed").length,
        skippedRuns: history.filter((h) => h.status === "skipped").length,
        avgTotalMs,
        avgRiskScore,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getPRAnalysis(req, res, next) {
  try {
    const { owner, repo, prNumber } = req.params;
    const run = await reviewRunService.getPRRun({
      owner,
      repo,
      prNumber: Number(prNumber),
    });

    if (!run) {
      return res
        .status(404)
        .json({ ok: false, message: "PR analysis not found" });
    }

    res.json({ ok: true, analysis: run });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRepoSettings,
  upsertRepoSettings,
  getRepoHistory,
  getRepoInsights,
  getPRAnalysis,
};
