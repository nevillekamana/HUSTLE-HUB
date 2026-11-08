const httpStatus = require('../utils/httpStatus');
const { sendSuccess } = require('../utils/apiResponse');
const { AuditLog, toPublicAuditLog } = require('../models/auditLogModel');
const { record } = require('../services/auditService');

const listAuditLogs = async (req, res) => {
  const { page, limit, skip, action, outcome } = req.auditQuery;
  const filter = {};
  if (action) filter.action = action;
  if (outcome) filter.outcome = outcome;
  const [entries, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(filter)
  ]);
  await record({ req, action: 'admin.audit.view', details: { page, limit } });
  return sendSuccess(res, httpStatus.OK, 'audit log retrieved', { entries: entries.map(toPublicAuditLog), page, limit, total });
};
module.exports = { listAuditLogs };
