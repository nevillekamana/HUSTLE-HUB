const { randomUUID } = require('crypto');
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  req.id = randomUUID();
  res.setHeader('X-Request-Id', req.id);
  const started = process.hrtime.bigint();
  res.on('finish', () => logger[res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info']('http.request', {
    requestId: req.id,
    method: req.method,
    path: String(req.originalUrl || req.url).split('?')[0].slice(0, 200),
    status: res.statusCode,
    durationMs: Number(process.hrtime.bigint() - started) / 1e6,
    userId: req.auth?.id,
    role: req.auth?.role
  }));
  next();
};
