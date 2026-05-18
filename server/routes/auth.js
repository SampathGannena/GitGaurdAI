const express = require('express');
const controller = require('../controllers/authController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', requireAuth, controller.me);
router.get('/github/start', requireAuth, controller.startGithubOAuth);
router.get('/github/callback', controller.handleGithubCallback);

module.exports = router;