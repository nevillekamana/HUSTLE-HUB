const test = require('node:test');
const assert = require('node:assert/strict');
const { createLogger, redact } = require('../utils/logger');

test('structured logger emits JSON and redacts sensitive fields', () => {
  const lines = [];
  const logger = createLogger({ write: (line) => lines.push(JSON.parse(line)) });
  logger.info('auth.login', { password: 'secret', requestId: 'r1', nested: { token: 'jwt' } });
  assert.equal(lines[0].event, 'auth.login');
  assert.equal(lines[0].password, '[redacted]');
  assert.equal(lines[0].nested.token, '[redacted]');
});
test('logger handles secrets in error text', () => assert.equal(redact('mongodb://user:pass@example/db').includes('pass'), false));
