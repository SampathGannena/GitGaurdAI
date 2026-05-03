const test = require('node:test');
const assert = require('node:assert/strict');

const insights = require('../server/services/reviewInsights');

test('computeRiskScore increases for critical security-sensitive changes', () => {
  const low = insights.computeRiskScore({ filePath: 'src/ui/view.js', severity: 'low', category: 'correctness', changedLines: ['a'] });
  const high = insights.computeRiskScore({
    filePath: 'src/auth/securityService.js',
    severity: 'critical',
    category: 'security',
    changedLines: new Array(30).fill('line'),
  });

  assert.equal(low < high, true);
  assert.equal(high <= 100, true);
});

test('buildFindingFingerprint is stable for same input', () => {
  const first = insights.buildFindingFingerprint({
    owner: 'acme',
    repo: 'gitguard',
    prNumber: 1,
    filePath: 'a.js',
    title: 'Bug',
    suggestion: 'fix',
  });
  const second = insights.buildFindingFingerprint({
    owner: 'acme',
    repo: 'gitguard',
    prNumber: 1,
    filePath: 'a.js',
    title: 'Bug',
    suggestion: 'fix',
  });
  assert.equal(first, second);
});
