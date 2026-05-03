import React, { useState } from 'react'
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export default function ConfigurationLab() {
  const [testMode, setTestMode] = useState('strictMode')
  const [testCode, setTestCode] = useState(`function transferFunds(user, amount) {
  const balance = user.account.balance;
  user.account.balance = balance - amount;
  return true;
}`)
  const [prediction, setPrediction] = useState('')
  const [simulateRunning, setSimulateRunning] = useState(false)

  const modes = [
    {
      id: 'strictMode',
      label: '🔍 Strict Mode',
      description: 'Flag all potential issues, even minor style problems',
      icon: '🔍',
    },
    {
      id: 'securityFirst',
      label: '🔒 Security First',
      description: 'Prioritize security vulnerabilities and auth issues',
      icon: '🔒',
    },
    {
      id: 'performanceMode',
      label: '⚡ Performance',
      description: 'Focus on efficiency and optimization opportunities',
      icon: '⚡',
    },
  ]

  const simulate = async () => {
    setSimulateRunning(true)
    setPrediction('🔄 Analyzing code...')
    await new Promise(r => setTimeout(r, 1200))

    let result = ''
    if (testMode === 'strictMode') {
      result = `🔍 STRICT MODE ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[HIGH] Missing input validation
  Location: Line 1
  Description: Function does not validate user or amount parameters
  Suggestion: Add guard clauses at the start of the function

[MEDIUM] No error handling
  Location: Line 1-4
  Description: No try-catch or error handling implemented
  Suggestion: Wrap logic in try-catch for robustness

[MEDIUM] Direct state mutation
  Location: Line 3
  Description: Direct mutation of user.account.balance
  Suggestion: Create new object instead of mutating directly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Analysis Complete | 3 Issues Found`
    } else if (testMode === 'securityFirst') {
      result = `🔒 SECURITY-FIRST ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[CRITICAL] Missing authorization check
  Location: Line 1
  Description: No verification that current user is authorized to transfer funds
  Suggestion: Add permission/authorization check before processing

[HIGH] No audit logging
  Location: Line 1-4
  Description: No audit trail for financial transactions
  Suggestion: Log all fund transfers with timestamp and user ID

[HIGH] Race condition vulnerability
  Location: Line 2-3
  Description: Balance read/write not atomic - vulnerable to race conditions
  Suggestion: Use database transactions or atomic operations

[MEDIUM] Amount not validated as positive
  Location: Line 2
  Description: No check that amount is positive
  Suggestion: Add validation: if (amount <= 0) throw Error(...)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Security Analysis Complete | 4 Issues Found`
    } else if (testMode === 'performanceMode') {
      result = `⚡ PERFORMANCE ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[MEDIUM] Direct property mutation
  Location: Line 3
  Description: Direct mutation prevents optimization and caching
  Suggestion: Use immutable patterns or object spread operator

[LOW] No batch processing capability
  Location: Line 1
  Description: Function only handles single transfer
  Suggestion: Consider batch processing for multiple transfers

[LOW] Redundant balance variable
  Location: Line 2
  Description: Unnecessary intermediate variable
  Suggestion: Simplify to: user.account.balance -= amount

[INFO] Memoization opportunity
  Location: Line 1
  Description: Function could benefit from result caching
  Suggestion: Consider memoizing for repeated calls with same params

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Performance Analysis Complete | 4 Suggestions`
    }

    setPrediction(result)
    setSimulateRunning(false)
  }

  const currentMode = modes.find(m => m.id === testMode)

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 pb-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-2">
        <h1 className="section-title">🧪 Configuration Lab</h1>
        <p className="text-dark-400">Test different analysis modes and preview review behavior before deployment</p>
      </motion.div>

      {/* Mode Selection */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setTestMode(mode.id)}
            className={`card-hover text-left transition-all duration-300 ${
              testMode === mode.id
                ? 'ring-2 ring-brand-primary bg-brand-primary/10'
                : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{mode.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-dark-100">{mode.label}</h3>
                <p className="text-xs text-dark-500 mt-1">{mode.description}</p>
              </div>
              {testMode === mode.id && (
                <span className="text-brand-primary font-bold">✓</span>
              )}
            </div>
          </button>
        ))}
      </motion.div>

      {/* Main Lab Area */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        {/* Code Input */}
        <div className="card space-y-4">
          <div>
            <h3 className="font-semibold text-dark-100 mb-2 flex items-center gap-2">
              <span>💻</span> Test Code
            </h3>
            <p className="text-xs text-dark-500 mb-3">Paste code to analyze with {currentMode?.label}</p>
          </div>

          <textarea
            value={testCode}
            onChange={(e) => setTestCode(e.target.value)}
            className="w-full h-64 input-field font-mono text-sm resize-none"
            placeholder="Paste your code here..."
          />

          <button
            onClick={simulate}
            disabled={simulateRunning}
            className="w-full btn-primary py-3 font-semibold"
          >
            {simulateRunning ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Analyzing...
              </>
            ) : (
              <>
                <span className="mr-2">▶</span>
                Simulate Analysis
              </>
            )}
          </button>
        </div>

        {/* Prediction Output */}
        <div className="card space-y-4 flex flex-col">
          <div>
            <h3 className="font-semibold text-dark-100 mb-2 flex items-center gap-2">
              <span>📊</span> Analysis Results
            </h3>
            <p className="text-xs text-dark-500">Review findings and suggestions</p>
          </div>

          <div className="flex-1 bg-dark-900 rounded-lg p-4 border border-dark-700 overflow-y-auto">
            <pre className="font-mono text-xs text-dark-300 whitespace-pre-wrap leading-relaxed">
              {prediction || (
                <span className="text-dark-600">
                  Analysis results will appear here...{'\n\n'}
                  Select a mode and click "Simulate Analysis" to get started.
                </span>
              )}
            </pre>
          </div>
        </div>
      </motion.div>

      {/* Mode Description */}
      {currentMode && (
        <motion.div variants={itemVariants} className="card bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 border border-brand-primary/20">
          <div className="flex gap-4">
            <span className="text-3xl">{currentMode.icon}</span>
            <div>
              <h3 className="font-bold text-dark-100 mb-2">{currentMode.label} Explained</h3>
              <p className="text-sm text-dark-400 mb-3">{currentMode.description}</p>
              <div className="text-xs text-dark-500 space-y-1">
                {currentMode.id === 'strictMode' && (
                  <>
                    <p>• Reports all potential issues regardless of severity</p>
                    <p>• Includes style, convention, and best practice violations</p>
                    <p>• Best for teams with high quality standards</p>
                  </>
                )}
                {currentMode.id === 'securityFirst' && (
                  <>
                    <p>• Focuses primarily on security vulnerabilities</p>
                    <p>• Prioritizes authentication, authorization, and data protection</p>
                    <p>• Best for security-sensitive applications</p>
                  </>
                )}
                {currentMode.id === 'performanceMode' && (
                  <>
                    <p>• Identifies performance and optimization opportunities</p>
                    <p>• Suggests efficient patterns and algorithms</p>
                    <p>• Best for performance-critical systems</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tip Card */}
      <motion.div variants={itemVariants} className="card bg-gradient-to-br from-brand-secondary/10 to-brand-accent/10 border border-brand-secondary/20">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="font-semibold text-dark-100 mb-1">Pro Tip</p>
            <p className="text-sm text-dark-400">
              Use this lab to experiment with different analysis modes and code snippets before applying them to your actual repositories. This helps you understand how GitGuard will analyze your team's code.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
