import React, { useEffect, useState, useRef } from "react";
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

  // Auto scroll to bottom
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
      if (!res.ok) throw new Error("Failed to load messages");
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMessages = (e) => {
    e.preventDefault();
    if (prNumber.trim()) {
      fetchMessages(prNumber);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !prNumber) return;

    setLoading(true);
    try {
      const res = await apiFetch(
        `${apiBase}/chat/${owner}/${repo}/${prNumber}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newMessage }),
        },
      );

      if (!res.ok) throw new Error("Failed to send message");
      const data = await res.json();
      setMessages([...messages, data.message]);
      setNewMessage("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReply = async (messageId) => {
    if (!replyText.trim()) return;

    setLoading(true);
    try {
      const res = await apiFetch(
        `${apiBase}/chat/${owner}/${repo}/${prNumber}/${messageId}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: replyText }),
        },
      );

      if (!res.ok) throw new Error("Failed to add reply");
      const data = await res.json();

      // Update message in list
      setMessages(
        messages.map((m) => (m._id === messageId ? data.message : m)),
      );
      setReplyText("");
      setActiveMessageId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveThread = async (messageId) => {
    setLoading(true);
    try {
      const res = await apiFetch(
        `${apiBase}/chat/${owner}/${repo}/${prNumber}/${messageId}/resolve`,
        { method: "PUT" },
      );

      if (!res.ok) throw new Error("Failed to resolve");
      const data = await res.json();
      setMessages(
        messages.map((m) => (m._id === messageId ? data.message : m)),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;

    setLoading(true);
    try {
      const res = await apiFetch(`${apiBase}/chat/${messageId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");
      setMessages(messages.filter((m) => m._id !== messageId));
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
      className="h-full flex flex-col space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">💬 Team Chat</h1>
        <p className="text-slate-400">
          Discuss findings and collaborate with your team
        </p>
      </div>

      {/* PR Selector */}
      <form onSubmit={handleLoadMessages} className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Select PR to View Chat
          </label>
          <input
            type="number"
            placeholder="Enter PR number..."
            value={prNumber}
            onChange={(e) => setPRNumber(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-white/20 text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !prNumber}
          className="px-6 py-2 rounded-lg bg-violet-600/50 hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
        >
          Load Chat
        </button>
      </form>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-lg bg-red-900/20 border border-red-700/50 text-red-200"
        >
          ⚠️ {error}
        </motion.div>
      )}

      {/* Messages Container */}
      {prNumber && (
        <div className="flex-1 flex flex-col min-h-0 rounded-lg border border-white/10 bg-white/5 overflow-hidden">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto space-y-4 p-6">
            {loading && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-r-transparent mb-4" />
                  <p className="text-slate-300">Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-center">
                <div>
                  <p className="text-lg mb-2">No messages yet</p>
                  <p className="text-sm">Start a discussion about this PR</p>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <motion.div
                  key={msg._id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 rounded-lg ${
                    msg.resolved
                      ? "bg-green-900/20 border border-green-700/50"
                      : "bg-slate-700/30 border border-white/10"
                  }`}
                >
                  {/* Message Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100">
                        {msg.author}
                      </span>
                      {msg.resolved && (
                        <span className="px-2 py-1 text-xs bg-green-700/50 text-green-300 rounded-full">
                          ✓ Resolved
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteMessage(msg._id)}
                      className="text-xs text-slate-400 hover:text-red-400 transition-all"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Message Content */}
                  <p className="text-slate-200 mb-3 whitespace-pre-wrap">
                    {msg.content}
                  </p>

                  {/* Timestamp */}
                  <p className="text-xs text-slate-500 mb-3">
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>

                  {/* Replies */}
                  {msg.replies && msg.replies.length > 0 && (
                    <div className="space-y-2 mb-3 pl-4 border-l-2 border-slate-600">
                      {msg.replies.map((reply, ridx) => (
                        <div key={ridx} className="text-sm">
                          <p className="font-semibold text-slate-300">
                            {reply.author}
                          </p>
                          <p className="text-slate-400 whitespace-pre-wrap">
                            {reply.content}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(reply.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setActiveMessageId(
                          activeMessageId === msg._id ? null : msg._id,
                        )
                      }
                      className="text-xs px-3 py-1 rounded-lg bg-slate-600/30 hover:bg-slate-600/50 transition-all"
                    >
                      Reply
                    </button>
                    {!msg.resolved && (
                      <button
                        onClick={() => handleResolveThread(msg._id)}
                        className="text-xs px-3 py-1 rounded-lg bg-green-600/30 hover:bg-green-600/50 transition-all"
                      >
                        Resolve
                      </button>
                    )}
                  </div>

                  {/* Reply Form */}
                  {activeMessageId === msg._id && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAddReply(msg._id);
                      }}
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      <input
                        type="text"
                        placeholder="Add a reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-white/20 text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:outline-none text-sm mb-2"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={loading || !replyText.trim()}
                          className="px-4 py-1 text-sm rounded-lg bg-violet-600/50 hover:bg-violet-600 disabled:opacity-50 transition-all"
                        >
                          Send Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMessageId(null);
                            setReplyText("");
                          }}
                          className="px-4 py-1 text-sm rounded-lg bg-slate-600/30 hover:bg-slate-600/50 transition-all"
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

          {/* Message Input */}
          {prNumber && (
            <form
              onSubmit={handleSendMessage}
              className="p-6 border-t border-white/10 bg-slate-800/30"
            >
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Type your message... (press Enter to send)"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-800/50 border border-white/20 text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !newMessage.trim()}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 hover:shadow-lg hover:shadow-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                >
                  Send
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </motion.div>
  );
}
