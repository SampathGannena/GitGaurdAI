const test = require('node:test');
const assert = require('node:assert/strict');

const rules = require('../server/services/rulesEngine');

test('ignoreLint excludes lint files when enabled', () => {
  const settings = { enabled: true, rules: { ignoreLint: true } };
  assert.equal(rules.shouldAnalyzeFile('.eslintrc.js', settings), false);
  assert.equal(rules.shouldAnalyzeFile('src/core.js', settings), true);
});

test('securityFirst only keeps security-related hunk lines', () => {
  const settings = { rules: { securityFirst: true } };
  const safe = { changedLines: ['const a = b + c;'] };
  const risky = { changedLines: ['const token = req.headers.authorization;'] };
  assert.equal(rules.shouldAnalyzeHunk(safe, settings), false);
  assert.equal(rules.shouldAnalyzeHunk(risky, settings), true);
});

test('max caps return defaults', () => {
  assert.equal(rules.getMaxHunksPerPR({ rules: {} }), 80);
  assert.equal(rules.getMaxCommentsPerPR({ rules: {} }), 20);
});
