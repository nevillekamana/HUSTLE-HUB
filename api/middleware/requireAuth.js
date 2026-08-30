//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const httpStatus = require('../utils/httpStatus');
const { sendFailure } = require('../utils/apiResponse');
const { verifyToken } = require('../services/tokenService');

//-----------------------------------------------------\\
//                   TOKEN EXTRACTION
//-----------------------------------------------------\\

//the only scheme the api accepts, compared lowercased because clients differ
//on how they capitalise it
const BEARER = 'bearer';

//pulls the credential out of the authorization header, returning null for any
//header that is absent, malformed, or not a bearer credential
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

//-----------------------------------------------------\\
//                      AUTH GUARD
//-----------------------------------------------------\\

//refuses the request unless it carries a token this api signed and that has
//not expired, the verified claims are attached for the handler behind it
//a missing token, a malformed one, an expired one and a forged one all give
//the same answer, saying which would help someone work out what to try next
const requireAuth = (req, res, next) => {
  const token = readBearerToken(req.headers.authorization);

  if (!token) {
    return sendFailure(res, httpStatus.UNAUTHORIZED, 'authentication is required');
  }

  try {
    const payload = verifyToken(token);

    //only the two claims this api issues are carried forward, a claim role 2
    //adds later does not become trusted here without being named
    req.auth = { id: payload.id, role: payload.role };

    return next();
  } catch (error) {
    return sendFailure(res, httpStatus.UNAUTHORIZED, 'authentication is required');
  }
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = requireAuth;
