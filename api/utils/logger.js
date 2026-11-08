const REDACTED = '[redacted]';
const SECRET_KEY = /pass(word)?|secret|token|authorization|cookie|hash|credential|api[-_]?key/i;
const SECRET_TEXT = [/mongodb(?:\+srv)?:\/\/\S+/gi, /\beyJ[\w-]*\.[\w-]*\.[\w-]*/g];
const LEVELS = { silent: -1, error: 0, warn: 1, info: 2, debug: 3 };

const cleanString = (value) => SECRET_TEXT.reduce((result, pattern) => result.replace(pattern, REDACTED), String(value).slice(0, 500));
const redact = (value, depth = 0) => {
  if (depth > 5) return '[truncated]';
  if (value instanceof Error) return { name: value.name, message: cleanString(value.message) };
  if (typeof value === 'string') return cleanString(value);
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => redact(item, depth + 1));
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, SECRET_KEY.test(key) ? REDACTED : redact(child, depth + 1)]));
};

const createLogger = (options = {}) => {
  const level = options.level || 'info';
  const write = options.write || ((line, severity) => (severity === 'error' ? console.error(line) : console.log(line)));
  const threshold = LEVELS[level] ?? LEVELS.info;
  const emit = (severity, event, fields = {}) => {
    if (LEVELS[severity] > threshold) return;
    const line = { ...redact(fields), dt: new Date().toISOString(), level: severity, event, message: event };
    try { write(JSON.stringify(line), severity); } catch { /* logging must not affect requests */ }
  };
  return { error: (e, f) => emit('error', e, f), warn: (e, f) => emit('warn', e, f), info: (e, f) => emit('info', e, f), debug: (e, f) => emit('debug', e, f) };
};

const logger = createLogger({ level: process.env.LOG_LEVEL || 'info' });
logger.createLogger = createLogger;
logger.redact = redact;
logger.maskEmail = (email) => { const value = String(email || '').toLowerCase(); const at = value.indexOf('@'); return at > 0 ? value[0] + '***' + value.slice(at) : 'invalid'; };
module.exports = logger;
