const express = require("express");
const controller = require("../controllers/settingsController");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

router.get("/:owner/:repo", controller.getRepoSettings);
router.put("/:owner/:repo", controller.upsertRepoSettings);
router.get("/:owner/:repo/history", controller.getRepoHistory);
router.get("/:owner/:repo/insights", controller.getRepoInsights);
router.get("/:owner/:repo/runs/:prNumber", controller.getPRAnalysis);

module.exports = router;
