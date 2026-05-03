const crypto = require('crypto');

function computeRiskScore({ filePath, severity = 'medium', category = 'correctness', changedLines = [] }) {
  const severityBase = { low: 20, medium: 45, high: 70, critical: 90 }[severity] || 45;
  const categoryBoost = /security/i.test(category) ? 12 : /performance/i.test(category) ? 8 : 0;
  const sensitivePathBoost = /(auth|security|payment|config|db|database|infra|docker|k8s|terraform|secret)/i.test(filePath) ? 10 : 0;
  const volumeBoost = Math.min(10, Math.floor((changedLines.length || 0) / 5));
  return Math.max(0, Math.min(100, severityBase + categoryBoost + sensitivePathBoost + volumeBoost));
}

function buildFindingFingerprint({ owner, repo, prNumber, filePath, title, suggestion }) {
  const raw = `${owner}/${repo}#${prNumber}|${filePath}|${title || ''}|${(suggestion || '').slice(0, 200)}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 20);
}

function classifyBlastRadius({ filePath, changedLines = [] }) {
  const pathWeight = /(api|controller|service|middleware|auth|db|schema|migration)/i.test(filePath) ? 2 : 1;
  const lineWeight = changedLines.length > 30 ? 3 : changedLines.length > 10 ? 2 : 1;
  const score = pathWeight * lineWeight;
  if (score >= 6) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

function summarizeRun(findings) {
  if (!findings.length) {
    return {
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      avgRiskScore: 0,
    };
  }

  const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
  let totalRisk = 0;
  for (const f of findings) {
    bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
    totalRisk += f.riskScore || 0;
  }

  return {
    bySeverity,
    avgRiskScore: Number((totalRisk / findings.length).toFixed(2)),
  };
}

module.exports = {
  computeRiskScore,
  buildFindingFingerprint,
  classifyBlastRadius,
  summarizeRun,
};
