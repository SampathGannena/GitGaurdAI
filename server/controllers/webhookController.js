const logger = require('../config/logger');
const { enqueuePullRequestJob } = require('../services/jobQueue');

async function handleGithubWebhook(req, res, next) {
  try {
    const event = req.headers['x-github-event'];
    const payload = req.body;

    if (event !== 'pull_request') {
      return res.status(200).send({ ok: true, message: 'ignored event' });
    }

    const action = payload.action;
    if (!['opened', 'synchronize', 'reopened'].includes(action)) {
      return res.status(200).send({ ok: true, message: 'no-op for action' });
    }

    const job = await enqueuePullRequestJob(payload, event);
    res.status(202).json({ ok: true, queued: true, jobId: job.id });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleGithubWebhook };
