//------------------------------------------------\\
//          ROLE BASED ACCESS CONTROL
//------------------------------------------------\\

const httpStatus = require('../utils/httpStatus');
const { sendFailure } = require('../utils/apiResponse');
const requireAuth = require('./requireAuth');
const { ROLES, ALL_ROLES, PERMISSIONS } = require('../config/accessPolicy');

const FORBIDDEN_MESSAGE = 'you do not have permission to access this resource';

const refuseUnauthenticated = (res) =>
  sendFailure(res, httpStatus.UNAUTHORIZED, 'authentication is required');

const refuseForbidden = (res) => sendFailure(res, httpStatus.FORBIDDEN, FORBIDDEN_MESSAGE);

//------------------------------------------------\\
//                    ROLES
//------------------------------------------------\\

//lets the request through only when the signed in user has one of the
//roles given. a role that does not exist is a mistake in the code, so
//it stops the server at start up instead of quietly blocking everyone
const authorizeRoles = (...allowedRoles) => {
  if (allowedRoles.length === 0) {
    throw new Error('authorizeRoles needs at least one role');
  }
  allowedRoles.forEach((role) => {
    if (!ALL_ROLES.includes(role)) {
      throw new Error('authorizeRoles was given an unknown role: ' + String(role));
    }
  });
  return (req, res, next) => {
    if (!req.auth) {
      return refuseUnauthenticated(res);
    }
    if (!allowedRoles.includes(req.auth.role)) {
      return refuseForbidden(res);
    }
    return next();
  };
};

const requireClient = authorizeRoles(ROLES.CLIENT);
const requireFreelancer = authorizeRoles(ROLES.FREELANCER);
const requireAdmin = authorizeRoles(ROLES.ADMIN);

//------------------------------------------------\\
//                 PERMISSIONS
//------------------------------------------------\\

//token check and role check in one step, for use on a route:
//  router.post('/', protect('gigs:create'), validateGig, createGig);
//the roles behind each permission are listed in config/accessPolicy.js
const protect = (permission) => {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) {
    throw new Error('protect was given an unknown permission: ' + String(permission));
  }
  return [requireAuth, authorizeRoles(...allowedRoles)];
};

//------------------------------------------------\\
//                  OWNERSHIP
//------------------------------------------------\\

//a second line of defence behind the owner filter in the database
//query. resolveOwnerId is given the request and returns the id of the
//user who owns the record, or null when the record does not exist
const authorizeOwner = (resolveOwnerId, { allowAdmin = false } = {}) => {
  if (typeof resolveOwnerId !== 'function') {
    throw new Error('authorizeOwner needs a function that returns the owner id');
  }
  return async (req, res, next) => {
    if (!req.auth) {
      return refuseUnauthenticated(res);
    }
    try {
      const ownerId = await resolveOwnerId(req);
      if (ownerId === null || ownerId === undefined) {
        return sendFailure(res, httpStatus.NOT_FOUND, 'the requested resource does not exist');
      }
      const isOwner = String(ownerId) === String(req.auth.id);
      const isAdmin = allowAdmin && req.auth.role === ROLES.ADMIN;
      if (!isOwner && !isAdmin) {
        return refuseForbidden(res);
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

//------------------------------------------------\\
//                    EXPORTS
//------------------------------------------------\\

module.exports = {
  authorizeRoles,
  requireClient,
  requireFreelancer,
  requireAdmin,
  protect,
  authorizeOwner
};
