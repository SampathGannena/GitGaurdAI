const test = require('node:test');
const assert = require('node:assert/strict');

const { extractChangedHunks } = require('../server/services/diffAnalyzer');

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
