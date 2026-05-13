const axios = require('axios');
const logger = require('../config/logger');

const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
const DEPRECATED_GROQ_MODELS = new Set(['mixtral-8x7b-32768']);

async function analyzeHunk({ filePath, hunk, owner, repo, teamSettings = {}, rulesContext = {} }) {
  const prompt = `You are GitGuard AI reviewing ${owner}/${repo}.

Find bugs/security flaws in this added code.

Return ONLY valid JSON with keys:
- title: string (short issue headline)
- severity: one of low|medium|high|critical
- category: one of security|performance|correctness|maintainability
- confidence: number between 0 and 1
- suggestion: string (must contain corrected code in a fenced block)
- explanation: string (Markdown bullet list of issue(s))

Rules:
- Prioritize fix-first output.
- ${rulesContext.strictInstruction || 'Focus on practical issues.'}
- ${rulesContext.securityInstruction || 'Include security guidance only when relevant.'}
- Explanation tone: ${rulesContext.tone || 'human'}.
- Always format explanation as Markdown bullets (each line starts with "- ").
- Always format suggestion as a fenced code block with the corrected code.

Repo settings snapshot: ${JSON.stringify(teamSettings)}

Changed file: ${filePath}
Hunk header: ${hunk.header}
Added code:
${hunk.changedLines.join('\n') || '(no added code)'}

Diff context:
${hunk.patchLines.join('\n')}`;

  try {
    // Use Groq API for fast LLM inference
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: getGroqModel(),
      messages: [{ role: 'system', content: 'You are a helpful code reviewer.' }, { role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 800
    }, { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } });

    const text = res.data.choices?.[0]?.message?.content || '';
    const parsed = safeJsonParse(text);
    if (parsed) {
      return normalize(parsed);
    }

    return normalize({ suggestion: text, explanation: '' });
  } catch (err) {
    logger.error('Groq AI analysis error', err.message || err);
    return null;
  }
}

function getGroqModel() {
  const configuredModel = process.env.GROQ_MODEL;
  if (!configuredModel || DEPRECATED_GROQ_MODELS.has(configuredModel)) {
    return DEFAULT_GROQ_MODEL;
  }
  return configuredModel;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    const fenced = text.match(/```json\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1]);
      } catch (innerErr) {
        return null;
      }
    }
    const genericObject = text.match(/\{[\s\S]*\}/);
    if (genericObject?.[0]) {
      try {
        return JSON.parse(genericObject[0]);
      } catch (innerErr) {
        return null;
      }
    }
    return null;
  }
}

function normalize(raw) {
  const confidence = Number(raw.confidence);
  return {
    title: typeof raw.title === 'string' ? raw.title : '',
    severity: normalizeSeverity(raw.severity),
    category: normalizeCategory(raw.category),
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0.65,
    suggestion: typeof raw.suggestion === 'string' ? raw.suggestion : '',
    explanation: typeof raw.explanation === 'string' ? raw.explanation : '',
  };
}

function normalizeSeverity(severity) {
  const val = String(severity || '').toLowerCase();
  return ['low', 'medium', 'high', 'critical'].includes(val) ? val : 'medium';
}

function normalizeCategory(category) {
  const val = String(category || '').toLowerCase();
  return ['security', 'performance', 'correctness', 'maintainability'].includes(val) ? val : 'correctness';
}

module.exports = { analyzeHunk, getGroqModel };
