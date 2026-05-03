function parseHunksFromPatch(patch) {
  if (!patch) return [];
  const lines = patch.split('\n');
  const hunks = [];
  let current = null;

  const hunkHeaderRe = /^@@ -\d+,?\d* \+(\d+)(?:,(\d+))? @@/;

  for (const line of lines) {
    const m = line.match(hunkHeaderRe);
    if (m) {
      if (current) hunks.push(current);
      const newStart = parseInt(m[1], 10);
      const newCount = m[2] ? parseInt(m[2], 10) : 1;
      current = { header: line, newStart, newCount, lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) hunks.push(current);
  return hunks.map(h => ({
    header: h.header,
    newStart: h.newStart,
    newCount: h.newCount,
    patchLines: h.lines,
    changedLines: h.lines.filter(l => l.startsWith('+')).map(l => l.substring(1))
  }));
}

function extractChangedHunks(files) {
  return files.map(f => ({ filename: f.filename, hunks: parseHunksFromPatch(f.patch) }));
}

module.exports = { extractChangedHunks };
