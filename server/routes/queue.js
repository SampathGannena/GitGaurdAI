const express = require('express');
const controller = require('../controllers/queueController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);
router.get('/metrics', controller.getQueueMetrics);
router.post('/cleanup', controller.cleanupOldJobs);

module.exports = router;
