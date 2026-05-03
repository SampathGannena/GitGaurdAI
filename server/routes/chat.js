const express = require("express");
const controller = require("../controllers/chatController");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

// Get all messages for a PR
router.get("/:owner/:repo/:prNumber", controller.getMessages);

// Post a new message
router.post("/:owner/:repo/:prNumber", controller.postMessage);

// Add a reply to a message
router.post("/:owner/:repo/:prNumber/:messageId/replies", controller.addReply);

// Mark a thread as resolved
router.put(
  "/:owner/:repo/:prNumber/:messageId/resolve",
  controller.resolveThread,
);

// Delete a message (only by author)
router.delete("/:messageId", controller.deleteMessage);

module.exports = router;
