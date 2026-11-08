const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoginAttemptService } = require('../services/loginAttemptService');

const fakeModel = () => {
  const records = new Map();
  return {
    records,
    findOne: ({ key }) => ({ lean: async () => records.get(key) || null }),
    findOneAndUpdate: async ({ key }, update) => {
      const current = records.get(key) || { key, failures: 0 };
      const next = { ...current, failures: current.failures + update.$inc.failures, expiresAt: update.$set.expiresAt };
      records.set(key, next); return next;
    },
    updateOne: async ({ key }, update) => records.set(key, { ...records.get(key), ...update.$set }),
    deleteOne: async ({ key }) => records.delete(key)
  };
};

test('locks after three failures, blocks correct-password path, and isolates accounts', async () => {
  let now = new Date('2026-01-01T00:00:00Z');
  const model = fakeModel();
  const service = createLoginAttemptService({ model, maxFailures: 3, durationMs: 60000, now: () => now });
  await service.recordFailure('a@example.com');
  await service.recordFailure('a@example.com');
  assert.equal((await service.check('a@example.com')).locked, false);
  assert.equal((await service.recordFailure('a@example.com')).locked, true);
  assert.equal((await service.check('a@example.com')).locked, true);
  assert.equal((await service.check('b@example.com')).locked, false);
  now = new Date(now.getTime() + 60001);
  assert.equal((await service.check('a@example.com')).locked, false);
});

test('normalization shares a counter without storing the email', async () => {
  const model = fakeModel();
  const service = createLoginAttemptService({ model, maxFailures: 2 });
  await service.recordFailure('Alice@Example.com');
  const result = await service.recordFailure(' alice@example.com ');
  assert.equal(result.locked, true);
  assert.equal([...model.records.keys()][0].includes('alice'), false);
});
