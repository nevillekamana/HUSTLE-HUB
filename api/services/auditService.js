const mongoose = require('mongoose');
const { AuditLog } = require('../models/auditLogModel');
const logger = require('../utils/logger');

const cleanDetails = (details = {}) => Object.fromEntries(Object.entries(details).filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value)).slice(0, 10).map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, 120) : value]));
const record = async ({ req, action, outcome = 'success', actor, actorRole, subject, targetType, targetId, details } = {}) => {
  const entry = { action, outcome, actor: actor ?? req?.auth?.id ?? null, actorRole: actorRole ?? req?.auth?.role ?? null, subject: subject || null, targetType: targetType || null, targetId: targetId ? String(targetId) : null, ip: req?.ip || null, requestId: req?.id || null, details: cleanDetails(details) };
  if (entry.actor && !mongoose.isValidObjectId(entry.actor)) entry.actor = null;
  logger[outcome === 'success' ? 'info' : 'warn']('audit.' + action, entry);
  try { await AuditLog.create(entry); } catch (error) { logger.error('audit.write_failed', { action, requestId: entry.requestId, error }); }
};
module.exports = { record, cleanDetails };
