const express = require("express");
const controller = require("../controllers/settingsController");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

router.get("/repositories", controller.listLinkedRepositories);
router.get("/:owner/:repo", controller.getRepoSettings);
router.put("/:owner/:repo", controller.upsertRepoSettings);
router.post("/:owner/:repo/connect-github", controller.connectGithubRepo);
router.delete("/:owner/:repo/connect-github", controller.unlinkGithubRepo);
router.get("/:owner/:repo/github-status", controller.getGithubStatus);
router.get("/:owner/:repo/history", controller.getRepoHistory);
router.get("/:owner/:repo/insights", controller.getRepoInsights);
router.get("/:owner/:repo/runs/:prNumber", controller.getPRAnalysis);

module.exports = router;
