const logger = require('../config/logger');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  logger.error(err.stack || err.message || err);
  res.status(500).json({ error: 'internal_server_error', message: err.message || 'Unexpected error' });
}

module.exports = { errorHandler };
