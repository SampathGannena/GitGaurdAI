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
    changedLines: h.lines
      .filter(l => l.startsWith('+') && !l.startsWith('+++'))
      .map(l => l.substring(1))
  }));
}

function parseRawDiff(rawDiff) {
  if (!rawDiff) return [];

  const files = [];
  const lines = rawDiff.split('\n');
  let current = null;

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      if (current) files.push(current);
      current = { filename: '', patchLines: [] };
      continue;
    }

    if (!current) continue;

    if (line.startsWith('+++ b/')) {
      current.filename = line.slice('+++ b/'.length);
      continue;
    }

    if (line.startsWith('+++ ')) {
      current.filename = line.slice('+++ '.length);
      continue;
    }

    if (line.startsWith('@@ ') || current.patchLines.length > 0) {
      current.patchLines.push(line);
    }
  }

  if (current) files.push(current);

  return files
    .filter(file => file.filename && file.filename !== '/dev/null')
    .map(file => ({
      filename: file.filename,
      patch: file.patchLines.join('\n'),
    }));
}

function extractChangedHunks(filesOrRawDiff) {
  const files = typeof filesOrRawDiff === 'string'
    ? parseRawDiff(filesOrRawDiff)
    : filesOrRawDiff;

  return files.map(f => ({ filename: f.filename, hunks: parseHunksFromPatch(f.patch) }));
}

module.exports = { extractChangedHunks, parseRawDiff };
