const test = require('node:test');
const assert = require('node:assert/strict');

const { extractChangedHunks, parseRawDiff } = require('../server/services/diffAnalyzer');

test('extractChangedHunks parses hunks and added lines', () => {
  const files = [
    {
      filename: 'src/app.js',
      patch: [
        '@@ -1,3 +1,4 @@',
        ' const x = 1;',
        '+const y = 2;',
        ' function run() {}',
      ].join('\n'),
    },
  ];

  const out = extractChangedHunks(files);
  assert.equal(out.length, 1);
  assert.equal(out[0].hunks.length, 1);
  assert.equal(out[0].hunks[0].changedLines[0], 'const y = 2;');
});

test('parseRawDiff splits a GitHub raw diff into file patches', () => {
  const rawDiff = [
    'diff --git a/src/app.js b/src/app.js',
    'index 1111111..2222222 100644',
    '--- a/src/app.js',
    '+++ b/src/app.js',
    '@@ -1,2 +1,3 @@',
    ' const x = 1;',
    '+const y = 2;',
    ' module.exports = x;',
  ].join('\n');

  const files = parseRawDiff(rawDiff);
  assert.equal(files.length, 1);
  assert.equal(files[0].filename, 'src/app.js');
  assert.match(files[0].patch, /\+const y = 2;/);

  const out = extractChangedHunks(rawDiff);
  assert.equal(out[0].hunks[0].changedLines[0], 'const y = 2;');
});
