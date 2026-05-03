const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema(
  {
    owner: { type: String, required: true, index: true },
    repo: { type: String, required: true, index: true },
    prNumber: { type: Number, required: true, index: true },
    findingId: String, // Optional: link to specific finding
    threadId: String, // Optional: group messages into threads
    author: { type: String, required: true }, // GitHub username or user email
    content: { type: String, required: true },
    mentions: [String], // @mentioned usernames
    resolved: { type: Boolean, default: false },
    replies: [
      {
        author: String,
        content: String,
        createdAt: Date,
        mentions: [String],
      },
    ],
  },
  { timestamps: true },
);

// Compound index for efficient queries
ChatMessageSchema.index({ owner: 1, repo: 1, prNumber: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", ChatMessageSchema);
