import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function ChatPage({ apiBase, apiFetch, owner, repo }) {
  const [messages, setMessages] = useState([]);
  const [prNumber, setPRNumber] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async (prNum) => {
    if (!owner || !repo || !prNum) return;

    setLoading(true);
    setError("");

    try {
      const res = await apiFetch(`${apiBase}/chat/${owner}/${repo}/${prNum}`);
      if (!res.ok) throw new Error("Failed to load AI assistance history");
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMessages = (event) => {
    event.preventDefault();
    if (!owner || !repo) {
      setError("Connect a repository before using AI Assistance.");
      return;
    }
    if (prNumber.trim()) {
      fetchMessages(prNumber);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!newMessage.trim() || !prNumber) return;

    setLoading(true);
    setError("");

    try {
      const res = await apiFetch(`${apiBase}/chat/${owner}/${repo}/${prNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!res.ok) throw new Error("Failed to save AI prompt");
      const data = await res.json();
      setMessages([
        ...messages,
        data.message,
        ...(data.assistantMessage ? [data.assistantMessage] : []),
      ]);
      setNewMessage("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFollowUp = async (messageId) => {
    if (!replyText.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await apiFetch(
        `${apiBase}/chat/${owner}/${repo}/${prNumber}/${messageId}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: replyText }),
        },
      );

      if (!res.ok) throw new Error("Failed to save follow-up");
      const data = await res.json();
      setMessages(messages.map((message) => (message._id === messageId ? data.message : message)));
      setReplyText("");
      setActiveMessageId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHandled = async (messageId) => {
    setLoading(true);
    setError("");

    try {
      const res = await apiFetch(
        `${apiBase}/chat/${owner}/${repo}/${prNumber}/${messageId}/resolve`,
        { method: "PUT" },
      );

      if (!res.ok) throw new Error("Failed to mark handled");
      const data = await res.json();
      setMessages(messages.map((message) => (message._id === messageId ? data.message : message)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePrompt = async (messageId) => {
    if (!window.confirm("Delete this AI prompt?")) return;

    setLoading(true);
    setError("");

    try {
      const res = await apiFetch(`${apiBase}/chat/${messageId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete prompt");
      setMessages(messages.filter((message) => message._id !== messageId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full flex-col space-y-6"
    >
      <div>
        <h1 className="mb-2 text-3xl font-bold text-white">AI Assistance</h1>
        <p className="text-slate-400">
          Ask for PR review guidance, risk explanations, and next-step suggestions.
        </p>
        <p className="mt-2 text-sm text-cyan-200">
          Connected repo: {owner && repo ? `${owner}/${repo}` : "No repository connected"}
        </p>
      </div>

      <form onSubmit={handleLoadMessages} className="flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            Select PR Context
          </label>
          <input
            type="number"
            placeholder="Enter PR number..."
            value={prNumber}
            onChange={(event) => setPRNumber(event.target.value)}
            className="w-full rounded-lg border border-white/20 bg-slate-800/50 px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !prNumber || !owner || !repo}
          className="rounded-lg bg-violet-600/50 px-6 py-2 font-semibold transition-all hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Load Context
        </button>
      </form>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-red-700/50 bg-red-900/20 p-4 text-red-200"
        >
          {error}
        </motion.div>
      )}

      {prNumber && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/10 bg-white/5">
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {loading && messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-r-transparent" />
                  <p className="text-slate-300">Loading AI assistance history...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-slate-400">
                <div>
                  <p className="mb-2 text-lg">No assistant prompts yet</p>
                  <p className="text-sm">
                    Ask GitGuard AI what to review, fix, or verify in this PR.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={message._id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-lg p-4 ${
                    message.resolved
                      ? "border border-green-700/50 bg-green-900/20"
                      : message.author === "GitGuard AI"
                        ? "border border-cyan-300/20 bg-cyan-300/10"
                      : "border border-white/10 bg-slate-700/30"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">
                        {message.author || "GitGuard user"}
                      </span>
                      {message.author === "GitGuard AI" && (
                        <span className="rounded-full bg-cyan-300/15 px-2 py-1 text-xs text-cyan-200">
                          Repo-aware
                        </span>
                      )}
                      {message.resolved && (
                        <span className="rounded-full bg-green-700/50 px-2 py-1 text-xs text-green-300">
                          Handled
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePrompt(message._id)}
                      className="text-xs text-slate-400 transition-all hover:text-red-400"
                      disabled={message.author === "GitGuard AI"}
                    >
                      Delete
                    </button>
                  </div>

                  <p className="mb-3 whitespace-pre-wrap text-slate-200">{message.content}</p>
                  <p className="mb-3 text-xs text-slate-500">
                    {new Date(message.createdAt).toLocaleString()}
                  </p>

                  {message.replies && message.replies.length > 0 && (
                    <div className="mb-3 space-y-2 border-l-2 border-slate-600 pl-4">
                      {message.replies.map((reply, replyIndex) => (
                        <div key={replyIndex} className="text-sm">
                          <p className="font-semibold text-slate-300">
                            {reply.author || "Follow-up"}
                          </p>
                          <p className="whitespace-pre-wrap text-slate-400">{reply.content}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(reply.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMessageId(activeMessageId === message._id ? null : message._id)
                      }
                      className="rounded-lg bg-slate-600/30 px-3 py-1 text-xs transition-all hover:bg-slate-600/50"
                    >
                      Follow up
                    </button>
                    {message.author !== "GitGuard AI" && !message.resolved && (
                      <button
                        type="button"
                        onClick={() => handleMarkHandled(message._id)}
                        className="rounded-lg bg-green-600/30 px-3 py-1 text-xs transition-all hover:bg-green-600/50"
                      >
                        Mark handled
                      </button>
                    )}
                  </div>

                  {activeMessageId === message._id && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleAddFollowUp(message._id);
                      }}
                      className="mt-4 border-t border-white/10 pt-4"
                    >
                      <input
                        type="text"
                        placeholder="Ask a follow-up..."
                        value={replyText}
                        onChange={(event) => setReplyText(event.target.value)}
                        className="mb-2 w-full rounded-lg border border-white/20 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={loading || !replyText.trim()}
                          className="rounded-lg bg-violet-600/50 px-4 py-1 text-sm transition-all hover:bg-violet-600 disabled:opacity-50"
                        >
                          Send Follow-up
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMessageId(null);
                            setReplyText("");
                          }}
                          className="rounded-lg bg-slate-600/30 px-4 py-1 text-sm transition-all hover:bg-slate-600/50"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.form>
                  )}
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="border-t border-white/10 bg-slate-800/30 p-6">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Ask GitGuard AI about this PR... (press Enter to send)"
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSendMessage(event);
                  }
                }}
                disabled={loading}
                className="flex-1 rounded-lg border border-white/20 bg-slate-800/50 px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !newMessage.trim() || !owner || !repo}
                className="rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 px-6 py-2 font-semibold transition-all hover:shadow-lg hover:shadow-violet-500/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Ask AI
              </button>
            </div>
          </form>
        </div>
      )}
    </motion.div>
  );
}
