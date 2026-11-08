const mongoose = require('mongoose');
const OUTCOMES = Object.freeze(['success', 'failure', 'denied']);
const schema = new mongoose.Schema({
  action: { type: String, required: true, maxlength: 60, index: true },
  outcome: { type: String, required: true, enum: OUTCOMES, index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  actorRole: { type: String, maxlength: 20, default: null },
  subject: { type: String, maxlength: 120, default: null },
  targetType: { type: String, maxlength: 30, default: null },
  targetId: { type: String, maxlength: 40, default: null },
  ip: { type: String, maxlength: 64, default: null },
  requestId: { type: String, maxlength: 40, default: null },
  details: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: { createdAt: true, updatedAt: false } });
const refuseMutation = () => { throw new Error('audit log entries cannot be changed or removed'); };
schema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndReplace', 'replaceOne', 'findOneAndDelete', 'deleteOne', 'deleteMany'], refuseMutation);
const AuditLog = mongoose.model('AuditLog', schema);
const toPublicAuditLog = (entry) => ({ id: entry.id, action: entry.action, outcome: entry.outcome, actor: entry.actor ? String(entry.actor) : null, actorRole: entry.actorRole, subject: entry.subject, targetType: entry.targetType, targetId: entry.targetId, ip: entry.ip, requestId: entry.requestId, details: entry.details || {}, createdAt: entry.createdAt });
module.exports = { AuditLog, OUTCOMES, toPublicAuditLog };
