const ChatMessage = require("../models/ChatMessage");
const logger = require("../config/logger");

async function getMessages(req, res, next) {
  try {
    const { owner, repo, prNumber } = req.params;
    const limit = Number(req.query.limit || 50);

    const messages = await ChatMessage.find({
      owner,
      repo,
      prNumber: Number(prNumber),
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ ok: true, messages: messages.reverse() });
  } catch (err) {
    next(err);
  }
}

async function postMessage(req, res, next) {
  try {
    const { owner, repo, prNumber } = req.params;
    const { content, findingId, mentions } = req.body;

    if (!content || !content.trim()) {
      return res
        .status(400)
        .json({ ok: false, message: "Message content required" });
    }

    const author = req.user?.email || req.user?.name || "anonymous";

    const message = await ChatMessage.create({
      owner,
      repo,
      prNumber: Number(prNumber),
      findingId,
      author,
      content: content.trim(),
      mentions: mentions || [],
    });

    res.status(201).json({ ok: true, message });
  } catch (err) {
    next(err);
  }
}

async function addReply(req, res, next) {
  try {
    const { owner, repo, prNumber, messageId } = req.params;
    const { content, mentions } = req.body;

    if (!content || !content.trim()) {
      return res
        .status(400)
        .json({ ok: false, message: "Reply content required" });
    }

    const author = req.user?.email || req.user?.name || "anonymous";

    const message = await ChatMessage.findByIdAndUpdate(
      messageId,
      {
        $push: {
          replies: {
            author,
            content: content.trim(),
            createdAt: new Date(),
            mentions: mentions || [],
          },
        },
      },
      { new: true },
    );

    if (!message) {
      return res.status(404).json({ ok: false, message: "Message not found" });
    }

    res.status(201).json({ ok: true, message });
  } catch (err) {
    next(err);
  }
}

async function resolveThread(req, res, next) {
  try {
    const { owner, repo, prNumber, messageId } = req.params;

    const message = await ChatMessage.findByIdAndUpdate(
      messageId,
      { resolved: true },
      { new: true },
    );

    if (!message) {
      return res.status(404).json({ ok: false, message: "Message not found" });
    }

    res.json({ ok: true, message });
  } catch (err) {
    next(err);
  }
}

async function deleteMessage(req, res, next) {
  try {
    const { messageId } = req.params;
    const author = req.user?.email || req.user?.name;

    const message = await ChatMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({ ok: false, message: "Message not found" });
    }

    if (message.author !== author) {
      return res.status(403).json({ ok: false, message: "Unauthorized" });
    }

    await ChatMessage.findByIdAndDelete(messageId);

    res.json({ ok: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMessages,
  postMessage,
  addReply,
  resolveThread,
  deleteMessage,
};
