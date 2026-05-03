const LINT_FILE_RE = /(^|\/)(\.eslintrc|\.prettierrc)|eslint|prettier|stylelint|tslint|lint/i;
const SECURITY_RE = /(auth|token|secret|password|jwt|crypto|encrypt|decrypt|permission|acl|sql|injection|xss|csrf)/i;

function shouldAnalyzeFile(filePath, settings) {
  if (settings?.enabled === false) return false;
  if (settings?.rules?.ignoreLint && LINT_FILE_RE.test(filePath)) {
    return false;
  }
  return true;
}

function shouldAnalyzeHunk(hunk, settings) {
  if (!hunk || !Array.isArray(hunk.changedLines)) return false;
  if (!settings?.rules?.securityFirst) return true;

  const joined = hunk.changedLines.join('\n');
  return SECURITY_RE.test(joined);
}

function buildAiRuleContext(settings) {
  const strictMode = settings?.rules?.strictMode ? 'enabled' : 'disabled';
  const securityFirst = settings?.rules?.securityFirst ? 'enabled' : 'disabled';
  const tone = settings?.rules?.explanationTone || 'human';

  const strictInstruction = settings?.rules?.strictMode
    ? 'Strict mode is enabled: flag risky logic, edge cases, missing validation, and potentially unsafe patterns.'
    : 'Strict mode is disabled: focus on practical, high-impact issues only.';

  const securityInstruction = settings?.rules?.securityFirst
    ? 'Security-first mode is enabled: prioritize vulnerabilities and secure coding fixes before other concerns.'
    : 'Security-first mode is disabled: cover correctness, maintainability, and security when relevant.';

  return {
    strictMode,
    securityFirst,
    tone,
    strictInstruction,
    securityInstruction,
  };
}

function shouldKeepSuggestion(analysis, settings) {
  if (!analysis || !analysis.suggestion) return false;

  // In strict mode, require both fix and explanation for higher quality comments.
  if (settings?.rules?.strictMode) {
    return Boolean(analysis.suggestion && analysis.explanation);
  }
  return true;
}

function getMaxHunksPerPR(settings) {
  return settings?.rules?.maxHunksPerPR || 80;
}

function getMaxCommentsPerPR(settings) {
  return settings?.rules?.maxCommentsPerPR || 20;
}

module.exports = {
  shouldAnalyzeFile,
  shouldAnalyzeHunk,
  buildAiRuleContext,
  shouldKeepSuggestion,
  getMaxHunksPerPR,
  getMaxCommentsPerPR,
};
