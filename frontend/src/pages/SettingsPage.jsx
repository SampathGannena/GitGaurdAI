import React, { useState } from "react";
import { motion } from "framer-motion";

const DEFAULT_SETTINGS = {
  enabled: true,
  rules: {
    strictMode: false,
    ignoreLint: true,
    securityFirst: false,
    enableReplayGuard: true,
    enableRiskSummary: true,
    explanationTone: "human",
    maxHunksPerPR: 20,
    maxCommentsPerPR: 10,
  },
};

function normalizeSettings(nextSettings = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...nextSettings,
    rules: {
      ...DEFAULT_SETTINGS.rules,
      ...(nextSettings.rules || {}),
    },
  };
}

export default function SettingsPage({ apiBase, apiFetch, owner, setOwner, repo, setRepo }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const repositoryReady = owner.trim() && repo.trim();

  const loadSettings = async () => {
    if (!repositoryReady) {
      setStatus("Enter a repository owner and name first.");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const response = await apiFetch(`${apiBase}/settings/${owner}/${repo}`);
      const data = await response.json();
      if (!data.ok) throw new Error("Unable to load settings");
      setSettings(normalizeSettings(data.settings));
      setStatus("Settings loaded.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!repositoryReady) {
      setStatus("Enter a repository owner and name first.");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const response = await apiFetch(`${apiBase}/settings/${owner}/${repo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizeSettings(settings)),
      });
      const data = await response.json();
      if (!data.ok) throw new Error("Unable to save settings");
      setSettings(normalizeSettings(data.settings));
      setStatus("Settings saved.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateRule = (key, value) => {
    setSettings((current) => ({
      ...current,
      rules: { ...current.rules, [key]: value },
    }));
  };

  const toggles = [
    ["enabled", "Enable Reviews", "Allow GitGuard to process PR webhooks for this repository."],
    ["strictMode", "Strict Mode", "Flag more edge cases and suspicious patterns."],
    ["securityFirst", "Security First", "Prioritize vulnerabilities before maintainability feedback."],
    ["ignoreLint", "Ignore Lint Files", "Skip lint and formatter-only files."],
    ["enableReplayGuard", "Replay Guard", "Prevent duplicate analysis for the same head SHA."],
    ["enableRiskSummary", "Risk Summary", "Store risk scoring and blast-radius metadata."],
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
          Repository Settings
        </p>
        <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Review policy and limits</h1>
            <p className="mt-2 text-sm text-slate-400">
              Keep settings separate from operations so demos stay focused and changes are deliberate.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
            <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner" className="control-input" />
            <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="Repository" className="control-input" />
            <button onClick={loadSettings} disabled={loading || !repositoryReady} className="btn-secondary">
              Load
            </button>
            <button onClick={saveSettings} disabled={loading || !repositoryReady} className="btn-primary">
              Save
            </button>
          </div>
        </div>
        {status && <p className="mt-4 text-sm text-slate-300">{status}</p>}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {toggles.map(([key, label, description]) => {
          const checked = key === "enabled" ? settings.enabled : settings.rules[key];
          return (
            <button
              key={key}
              onClick={() => {
                if (key === "enabled") setSettings({ ...settings, enabled: !settings.enabled });
                else updateRule(key, !settings.rules[key]);
              }}
              className={`rounded-2xl border p-5 text-left transition ${
                checked
                  ? "border-cyan-300/40 bg-cyan-300/10"
                  : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-white">{label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
                </div>
                <span
                  className={`mt-1 h-6 w-11 rounded-full p-1 transition ${
                    checked ? "bg-cyan-300" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`block h-4 w-4 rounded-full bg-slate-950 transition ${
                      checked ? "translate-x-5" : ""
                    }`}
                  />
                </span>
              </div>
            </button>
          );
        })}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-xl font-semibold text-white">Analysis Controls</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Explanation Tone</span>
            <select
              value={settings.rules.explanationTone}
              onChange={(event) => updateRule("explanationTone", event.target.value)}
              className="control-input"
            >
              <option value="human">Human</option>
              <option value="concise">Concise</option>
              <option value="detailed">Detailed</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Max Hunks per PR</span>
            <input
              type="number"
              min="1"
              max="500"
              value={settings.rules.maxHunksPerPR}
              onChange={(event) => updateRule("maxHunksPerPR", Number(event.target.value))}
              className="control-input"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Max Comments per PR</span>
            <input
              type="number"
              min="1"
              max="200"
              value={settings.rules.maxCommentsPerPR}
              onChange={(event) => updateRule("maxCommentsPerPR", Number(event.target.value))}
              className="control-input"
            />
          </label>
        </div>
      </section>
    </motion.div>
  );
}
