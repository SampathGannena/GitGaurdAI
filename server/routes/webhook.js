const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { verifyGithubSignature } = require('../middleware/verifyGithubSignature');

router.post('/', verifyGithubSignature, webhookController.handleGithubWebhook);

module.exports = router;
