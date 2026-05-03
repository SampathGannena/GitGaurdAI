import React from "react";
import { motion } from "framer-motion";

export default function LandingPage({ onGetStarted, onSignIn }) {
  const features = [
    {
      icon: "⚡",
      title: "Real-Time Analysis",
      description:
        "Analyze PRs instantly when they open with AI-powered code review",
    },
    {
      icon: "🔍",
      title: "Smart Diff Focus",
      description: "Only review changed code hunks, not the entire repository",
    },
    {
      icon: "🛡️",
      title: "Security First",
      description:
        "Detect vulnerabilities, performance issues, and code smells automatically",
    },
    {
      icon: "🔄",
      title: "Replay Guard",
      description:
        "Prevent duplicate findings on the same PR - keep feedback fresh",
    },
    {
      icon: "📊",
      title: "Risk Insights",
      description:
        "Visualize code quality trends, team metrics, and compliance status",
    },
    {
      icon: "💬",
      title: "Team Collaboration",
      description: "Discuss findings with teammates in real-time threads",
    },
  ];

  const stats = [
    { label: "Code Diffs Analyzed", value: "10K+" },
    { label: "Issues Found", value: "50K+" },
    { label: "Teams Using", value: "500+" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-slate-900 to-slate-950 text-slate-100 overflow-hidden">
      {/* Navigation Bar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 w-full border-b border-white/10 bg-black/40 backdrop-blur-xl z-50"
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            GitGuard AI
          </motion.h1>
          <div className="flex gap-4">
            <button
              onClick={onSignIn}
              className="px-6 py-2 rounded-lg border border-violet-500/50 text-violet-100 hover:bg-violet-600/20 transition-all"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-violet-500/50 transition-all font-medium"
            >
              Get Started
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="pt-32 pb-20 px-6 text-center max-w-4xl mx-auto"
      >
        <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
          Automated Code Review Powered by AI
        </h2>
        <p className="text-xl text-slate-300 mb-8 leading-relaxed">
          GitGuard AI analyzes pull requests in real-time, finding
          vulnerabilities, performance issues, and code smells before they reach
          production.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onGetStarted}
            className="px-8 py-4 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-violet-500/50 transition-all font-semibold text-lg"
          >
            Start Free Trial
          </button>
          <button className="px-8 py-4 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-all font-semibold text-lg">
            Watch Demo
          </button>
        </div>
      </motion.section>

      {/* Features Grid */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-20 px-6 max-w-6xl mx-auto"
      >
        <h3 className="text-4xl font-bold text-center mb-16">
          Why Teams Choose GitGuard AI
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="p-8 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/50 hover:bg-white/10 transition-all group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h4 className="text-xl font-semibold mb-3">{feature.title}</h4>
              <p className="text-slate-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-16 px-6 max-w-6xl mx-auto"
      >
        <div className="grid md:grid-cols-3 gap-12 text-center">
          {stats.map((stat, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <p className="text-slate-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-20 px-6 max-w-6xl mx-auto"
      >
        <h3 className="text-4xl font-bold text-center mb-16">How It Works</h3>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { num: "1", title: "PR Opens", desc: "Webhook triggers instantly" },
            { num: "2", title: "Analyze", desc: "AI reviews changed code" },
            { num: "3", title: "Review", desc: "Comments posted to PR" },
            { num: "4", title: "Improve", desc: "Team collaborates on fixes" },
          ].map((step, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="text-center"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {step.num}
              </div>
              <h4 className="text-lg font-semibold mb-2">{step.title}</h4>
              <p className="text-slate-400">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Security Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 px-6 max-w-6xl mx-auto"
      >
        <div className="rounded-2xl bg-gradient-to-r from-violet-600/20 to-cyan-600/20 border border-violet-500/30 p-12 text-center">
          <h3 className="text-3xl font-bold mb-4">🔒 Enterprise Security</h3>
          <p className="text-slate-300 mb-6">
            HMAC-signed webhooks, JWT tokens, MongoDB encryption, and role-based
            access control.
          </p>
          <p className="text-slate-400">SOC 2 & ISO 27001 ready</p>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="py-20 px-6 text-center"
      >
        <h3 className="text-4xl font-bold mb-8">Ready to Secure Your Code?</h3>
        <p className="text-xl text-slate-300 mb-8">
          Join 500+ teams already using GitGuard AI for automated code review
        </p>
        <button
          onClick={onGetStarted}
          className="px-10 py-4 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-violet-500/50 transition-all font-semibold text-lg"
        >
          Start Your Free Trial Today
        </button>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/40 py-8 px-6 text-center text-slate-400">
        <p>© 2024 GitGuard AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
