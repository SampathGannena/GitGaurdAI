require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const bodyParser = require("body-parser");
const logger = require("./config/logger");
const webhookRouter = require("./routes/webhook");
const settingsRouter = require("./routes/settings");
const authRouter = require("./routes/auth");
const chatRouter = require("./routes/chat");
const queueRouter = require("./routes/queue");
const { errorHandler } = require("./middleware/errorHandler");
const { connectDatabase } = require("./config/database");
const { startWebhookQueueWorker, stopWebhookQueueWorker } = require("./services/jobQueue");

const app = express();

app.use(helmet());
app.use(cors());
app.use(
  bodyParser.json({
    limit: "1mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/webhook", webhookRouter);
app.use("/auth", authRouter);
app.use("/settings", settingsRouter);
app.use("/chat", chatRouter);
app.use("/queue", queueRouter);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use(errorHandler);

const port = process.env.PORT || 3000;

async function bootstrap() {
  await connectDatabase();
  startWebhookQueueWorker();
  const server = app.listen(port, () => {
    logger.info(`GitGuard AI server listening on port ${port}`);
  });

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down...`);
    server.close(() => {
      logger.info("HTTP server closed");
    });

    await stopWebhookQueueWorker({ timeoutMs: 5000 });
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((err) => {
  logger.error(`Bootstrap failed: ${err.message}`);
  process.exit(1);
});
