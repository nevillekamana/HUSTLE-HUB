const { createHash } = require('crypto');
const { LoginAttempt } = require('../models/loginAttemptModel');
const { normaliseEmail } = require('../models/userModel');

const toKey = (email) => createHash('sha256').update(normaliseEmail(email)).digest('hex');
const createLoginAttemptService = ({ model = LoginAttempt, maxFailures = Number(process.env.LOCKOUT_MAX_FAILURES) || 3, durationMs = Number(process.env.LOCKOUT_DURATION_MS) || 900000, now = () => new Date() } = {}) => {
  const check = async (email) => {
    const record = await model.findOne({ key: toKey(email) }).lean();
    const locked = record?.lockedUntil && record.lockedUntil > now();
    return { locked: Boolean(locked), retryAfterSeconds: locked ? Math.max(1, Math.ceil((record.lockedUntil - now()) / 1000)) : 0 };
  };
  const recordFailure = async (email) => {
    const key = toKey(email); const current = now();
    const record = await model.findOneAndUpdate({ key }, { $inc: { failures: 1 }, $set: { expiresAt: new Date(current.getTime() + durationMs) } }, { upsert: true, returnDocument: 'after' });
    if (record.failures < maxFailures) return { locked: false, failures: record.failures };
    const lockedUntil = new Date(current.getTime() + durationMs);
    await model.updateOne({ key }, { $set: { failures: 0, lockedUntil, expiresAt: lockedUntil } });
    return { locked: true, failures: record.failures, retryAfterSeconds: Math.ceil(durationMs / 1000) };
  };
  const clear = (email) => model.deleteOne({ key: toKey(email) });
  return { check, recordFailure, clear };
};
module.exports = { createLoginAttemptService, toKey, ...createLoginAttemptService() };
