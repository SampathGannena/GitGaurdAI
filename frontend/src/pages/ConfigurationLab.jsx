import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const modes = [
  {
    id: "strictMode",
    label: "Strict Review",
    description: "Broad review coverage for correctness, maintainability, and edge cases.",
    accent: "cyan",
    score: 92,
    checks: ["Input validation", "Error handling", "State mutation", "Code clarity"],
  },
  {
    id: "securityFirst",
    label: "Security Gate",
    description: "Escalates authorization, data integrity, auditability, and abuse paths.",
    accent: "rose",
    score: 98,
    checks: ["Authorization", "Audit logging", "Race conditions", "Data validation"],
  },
  {
    id: "performanceMode",
    label: "Performance Pass",
    description: "Highlights unnecessary work, mutation patterns, and scalability risks.",
    accent: "amber",
    score: 74,
    checks: ["Mutation cost", "Batch readiness", "Redundant work", "Caching"],
  },
];

const modeStyles = {
  cyan: {
    ring: "ring-cyan-300/35",
    bg: "bg-cyan-300/10",
    border: "border-cyan-300/30",
    text: "text-cyan-200",
    fill: "bg-cyan-300",
  },
  rose: {
    ring: "ring-rose-300/35",
    bg: "bg-rose-300/10",
    border: "border-rose-300/30",
    text: "text-rose-200",
    fill: "bg-rose-300",
  },
  amber: {
    ring: "ring-amber-300/35",
    bg: "bg-amber-300/10",
    border: "border-amber-300/30",
    text: "text-amber-200",
    fill: "bg-amber-300",
  },
};

const simulations = {
  strictMode: {
    title: "Strict Review Simulation",
    summary: "3 findings would be raised before this policy ships.",
    findings: [
      {
        severity: "High",
        title: "Missing input validation",
        location: "Line 1",
        detail: "Validate user and amount before touching account state.",
      },
      {
        severity: "Medium",
        title: "No error boundary",
        location: "Lines 1-4",
        detail: "Wrap the transfer path with failure handling and explicit return states.",
      },
      {
        severity: "Medium",
        title: "Direct state mutation",
        location: "Line 3",
        detail: "Avoid mutating nested account state without a transaction or immutable write path.",
      },
    ],
  },
  securityFirst: {
    title: "Security Gate Simulation",
    summary: "4 security-sensitive findings would block merge until reviewed.",
    findings: [
      {
        severity: "Critical",
        title: "Missing authorization check",
        location: "Line 1",
        detail: "Verify the caller can move funds from this account before processing.",
      },
      {
        severity: "High",
        title: "Non-atomic balance update",
        location: "Lines 2-3",
        detail: "Use a transaction or atomic operation to prevent concurrent transfer races.",
      },
      {
        severity: "High",
        title: "No audit event",
        location: "Lines 1-4",
        detail: "Financial mutations should emit a traceable audit record.",
      },
      {
        severity: "Medium",
        title: "Amount accepts unsafe values",
        location: "Line 1",
        detail: "Reject zero, negative, non-finite, or over-limit transfer amounts.",
      },
    ],
  },
  performanceMode: {
    title: "Performance Pass Simulation",
    summary: "4 optimization notes would be generated for this snippet.",
    findings: [
      {
        severity: "Medium",
        title: "Mutation limits optimization",
        location: "Line 3",
        detail: "Direct nested writes make cache invalidation and predictable updates harder.",
      },
      {
        severity: "Low",
        title: "No batch pathway",
        location: "Line 1",
        detail: "Repeated single transfers could become expensive under high throughput.",
      },
      {
        severity: "Low",
        title: "Redundant local variable",
        location: "Line 2",
        detail: "The balance variable does not add safety unless paired with validation.",
      },
      {
        severity: "Info",
        title: "Potential idempotency guard",
        location: "Function scope",
        detail: "Transfer APIs often need request IDs to avoid duplicate work.",
      },
    ],
  },
};

const severityClass = {
  Critical: "border-rose-300/40 bg-rose-300/10 text-rose-100",
  High: "border-orange-300/40 bg-orange-300/10 text-orange-100",
  Medium: "border-amber-300/40 bg-amber-300/10 text-amber-100",
  Low: "border-cyan-300/40 bg-cyan-300/10 text-cyan-100",
  Info: "border-slate-300/30 bg-slate-300/10 text-slate-200",
};

export default function ConfigurationLab() {
  const [testMode, setTestMode] = useState("strictMode");
  const [testCode, setTestCode] = useState(`function transferFunds(user, amount) {
  const balance = user.account.balance;
  user.account.balance = balance - amount;
  return true;
}`);
  const [prediction, setPrediction] = useState(null);
  const [simulateRunning, setSimulateRunning] = useState(false);

  const currentMode = modes.find((mode) => mode.id === testMode) || modes[0];
  const currentStyle = modeStyles[currentMode.accent];

  const codeStats = useMemo(() => {
    const lines = testCode.split("\n").length;
    const chars = testCode.length;
    const riskySignals = [
      /balance\s*-/i.test(testCode),
      /\.\w+\.\w+\s*=/i.test(testCode),
      !/if\s*\(/i.test(testCode),
      !/try\s*\{/i.test(testCode),
    ].filter(Boolean).length;

    return { lines, chars, riskySignals };
  }, [testCode]);

  const simulate = async () => {
    setSimulateRunning(true);
    setPrediction(null);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setPrediction(simulations[testMode]);
    setSimulateRunning(false);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 pb-8"
    >
      <motion.section
        variants={itemVariants}
        className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/30 p-6 shadow-2xl md:p-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-cyan-200/70">
              Policy Workbench
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              Configuration Lab
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-400">
              Tune review behavior against a controlled snippet before applying rules to real pull requests.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-black/25 p-3 text-center">
            <div>
              <p className="text-2xl font-semibold text-white">{codeStats.lines}</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Lines</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{codeStats.chars}</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Chars</p>
            </div>
            <div>
              <p className={codeStats.riskySignals > 2 ? "text-2xl font-semibold text-amber-200" : "text-2xl font-semibold text-emerald-200"}>
                {codeStats.riskySignals}
              </p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Signals</p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="grid gap-4 lg:grid-cols-3">
        {modes.map((mode) => {
          const style = modeStyles[mode.accent];
          const selected = mode.id === testMode;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setTestMode(mode.id)}
              className={`relative flex min-h-[190px] flex-col rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.07] ${
                selected
                  ? `${style.border} ${style.bg} ring-2 ${style.ring}`
                  : "border-white/10 bg-white/[0.035]"
              }`}
            >
              <span className={`absolute right-5 top-5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${selected ? "bg-white text-slate-950" : "bg-white/10 text-slate-300"}`}>
                {selected ? "Active" : "Preview"}
              </span>
              <div className="pr-20">
                <h2 className="text-lg font-semibold leading-6 text-white">{mode.label}</h2>
                <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-400">{mode.description}</p>
              </div>
              <div className="mt-auto pt-4">
                <div className="h-2 overflow-hidden rounded-full bg-black/30">
                  <div className={`h-full ${style.fill}`} style={{ width: `${mode.score}%` }} />
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">Policy intensity {mode.score}%</p>
              </div>
            </button>
          );
        })}
      </motion.section>

      <motion.section variants={itemVariants} className="grid gap-6 xl:grid-cols-[1fr_1.05fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Scenario editor</h2>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${currentStyle.border} ${currentStyle.bg} ${currentStyle.text}`}>
              {currentMode.label}
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#080b12]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="font-mono text-[11px] text-slate-500">transfer-policy.js</span>
            </div>
            <textarea
              value={testCode}
              onChange={(event) => setTestCode(event.target.value)}
              className="hidden-scroll h-80 w-full resize-none bg-transparent p-4 font-mono text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600"
              placeholder="Paste code to simulate..."
            />
          </div>

          <button
            type="button"
            onClick={simulate}
            disabled={simulateRunning}
            className="mt-4 w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {simulateRunning ? "Running simulation..." : "Simulate review policy"}
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Review forecast</h2>
            </div>
            {simulateRunning && (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-300 border-r-transparent" />
            )}
          </div>

          <div className="min-h-[380px] rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            {!prediction && !simulateRunning && (
              <div className="grid h-[340px] place-items-center text-center">
                <div>
                  <p className="text-lg font-semibold text-slate-200">No simulation yet</p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    Pick a review mode, adjust the snippet, and run the policy simulation.
                  </p>
                </div>
              </div>
            )}

            {simulateRunning && (
              <div className="grid h-[340px] place-items-center text-center">
                <div>
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-300 border-r-transparent" />
                  <p className="text-sm text-slate-300">Evaluating policy signals...</p>
                </div>
              </div>
            )}

            {prediction && !simulateRunning && (
              <div>
                <div className={`rounded-2xl border p-4 ${currentStyle.border} ${currentStyle.bg}`}>
                  <p className={`text-sm font-semibold ${currentStyle.text}`}>{prediction.title}</p>
                  <p className="mt-2 text-sm text-slate-300">{prediction.summary}</p>
                </div>

                <div className="mt-4 space-y-3">
                  {prediction.findings.map((finding) => (
                    <div key={`${finding.severity}-${finding.title}`} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{finding.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{finding.location}</p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityClass[finding.severity] || severityClass.Info}`}>
                          {finding.severity}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-400">{finding.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Active checks
          </p>
          <div className="mt-4 grid gap-2">
            {currentMode.checks.map((check) => (
              <div key={check} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <span className="text-sm text-slate-200">{check}</span>
                <span className={`h-2.5 w-2.5 rounded-full ${currentStyle.fill}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
            Senior review note
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Use this lab to decide which review policy should gate a repository before you turn it on.
            The goal is not just more findings; it is matching signal strength to the risk profile of
            the codebase. Security-sensitive services should run stricter gates, while internal tools can
            favor maintainability and velocity.
          </p>
        </div>
      </motion.section>
    </motion.div>
  );
}
