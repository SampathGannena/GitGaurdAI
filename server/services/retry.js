function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getJitteredDelay(baseDelayMs, jitterRatio) {
  if (!jitterRatio) return baseDelayMs;
  const jitter = baseDelayMs * jitterRatio;
  return Math.max(0, Math.round(baseDelayMs - jitter + Math.random() * jitter * 2));
}

async function retryAsync(fn, options = {}) {
  const {
    retries = 3,
    minDelayMs = 300,
    maxDelayMs = 2000,
    factor = 2,
    jitterRatio = 0.2,
    onRetry,
  } = options;

  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      if (attempt >= retries) {
        break;
      }
      let delay = 0;
      if (Number.isFinite(err?.retryAfterMs) && err.retryAfterMs > 0) {
        delay = Math.max(minDelayMs, err.retryAfterMs);
        if (jitterRatio > 0) {
          delay = Math.round(delay + delay * jitterRatio * Math.random());
        }
      } else {
        delay = Math.min(maxDelayMs, minDelayMs * Math.pow(factor, attempt));
        delay = getJitteredDelay(delay, jitterRatio);
      }
      if (typeof onRetry === 'function') {
        onRetry({ attempt, delayMs: delay, error: err });
      }
      await sleep(delay);
    }
    attempt += 1;
  }

  throw lastError;
}

module.exports = { retryAsync };
