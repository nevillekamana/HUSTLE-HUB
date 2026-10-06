//------------------------------------------------\\
//              TOKEN AUTHENTICATION
//------------------------------------------------\\

const httpStatus = require('../utils/httpStatus');
const { sendFailure } = require('../utils/apiResponse');
const { verifyToken } = require('../services/tokenService');
const { ALL_ROLES } = require('../config/accessPolicy');

const BEARER = 'bearer';

//the header must be exactly "Bearer <token>"
const readBearerToken = (header) => {
  if (typeof header !== 'string') {
    return null;
  }
  const parts = header.trim().split(' ').filter((part) => part !== '');
  if (parts.length !== 2 || parts[0].toLowerCase() !== BEARER) {
    return null;
  }
  return parts[1];
};

//a token with a valid signature is still refused if it does not name a
//user and one of the three known roles
const isValidPayload = (payload) =>
  payload !== null &&
  typeof payload === 'object' &&
  typeof payload.id === 'string' &&
  payload.id !== '' &&
  ALL_ROLES.includes(payload.role);

//every failure gives the same answer, so a caller cannot tell a missing
//token from an expired, forged or malformed one
const refuse = (res) => {
  res.setHeader('WWW-Authenticate', 'Bearer');
  return sendFailure(res, httpStatus.UNAUTHORIZED, 'authentication is required');
};

const requireAuth = (req, res, next) => {
  const token = readBearerToken(req.headers.authorization);
  if (!token) {
    return refuse(res);
  }
  try {
    const payload = verifyToken(token);
    if (!isValidPayload(payload)) {
      return refuse(res);
    }
    //only the id and the role are kept: nothing else in a token is trusted
    req.auth = { id: payload.id, role: payload.role };
    return next();
  } catch (error) {
    return refuse(res);
  }
};

//------------------------------------------------\\
//                    EXPORTS
//------------------------------------------------\\

module.exports = requireAuth;
