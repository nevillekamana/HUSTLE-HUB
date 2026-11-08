const httpStatus = require('../utils/httpStatus');
const { sendFailure } = require('../utils/apiResponse');
const { SUPPORTED_TAX_YEARS } = require('../services/taxService');
const { OUTCOMES } = require('../models/auditLogModel');
const whole = (value) => /^\d+$/.test(value) && Number(value) > 0;
const validateTaxQuery = (req, res, next) => {
  const query = req.query || {};
  if (Object.keys(query).some((key) => key !== 'taxYear') || Array.isArray(query.taxYear)) return sendFailure(res, httpStatus.BAD_REQUEST, 'validation failed', [{ field: 'taxYear', message: 'is not a supported option' }]);
  if (query.taxYear !== undefined && (!/^\d{4}$/.test(query.taxYear) || !SUPPORTED_TAX_YEARS.includes(Number(query.taxYear)))) return sendFailure(res, httpStatus.BAD_REQUEST, 'validation failed', [{ field: 'taxYear', message: 'must be one of ' + SUPPORTED_TAX_YEARS.join(', ') }]);
  req.taxYear = query.taxYear === undefined ? undefined : Number(query.taxYear);
  next();
};
const validateAuditQuery = (req, res, next) => {
  const query = req.query || {};
  const errors = [];
  const allowed = ['page', 'limit', 'action', 'outcome'];
  for (const key of Object.keys(query)) {
    if (!allowed.includes(key)) errors.push({ field: key, message: 'is not a supported option' });
    else if (Array.isArray(query[key])) errors.push({ field: key, message: 'must be given only once' });
  }
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!whole(String(page))) errors.push({ field: 'page', message: 'must be a positive whole number' });
  if (!whole(String(limit)) || limit > 100) errors.push({ field: 'limit', message: 'must be a whole number between 1 and 100' });
  if (query.outcome !== undefined && !OUTCOMES.includes(query.outcome)) errors.push({ field: 'outcome', message: 'must be one of ' + OUTCOMES.join(', ') });
  if (query.action !== undefined && !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){0,3}$/.test(query.action)) errors.push({ field: 'action', message: 'must be a valid action' });
  if (errors.length) return sendFailure(res, httpStatus.BAD_REQUEST, 'validation failed', errors);
  req.auditQuery = { page, limit, skip: (page - 1) * limit, action: query.action, outcome: query.outcome };
  next();
};
module.exports = { validateTaxQuery, validateAuditQuery };
