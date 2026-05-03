require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('./config/logger');
const webhookRouter = require('./routes/webhook');
const settingsRouter = require('./routes/settings');
const authRouter = require('./routes/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { connectDatabase } = require('./config/database');

const app = express();

app.use(helmet());
app.use(cors());
app.use(bodyParser.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/webhook', webhookRouter);
app.use('/auth', authRouter);
app.use('/settings', settingsRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

const port = process.env.PORT || 3000;

async function bootstrap() {
  await connectDatabase();
  app.listen(port, () => {
    logger.info(`GitGuard AI server listening on port ${port}`);
  });
}

bootstrap().catch((err) => {
  logger.error(`Bootstrap failed: ${err.message}`);
  process.exit(1);
});
