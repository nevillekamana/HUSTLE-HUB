//-----------------------------------------------------\\
//                    SEAM — ROLE 2 OWNS THIS
//-----------------------------------------------------\\
//role 1 defines the interface only, role 2 implements the internals

//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const httpStatus = require('../utils/httpStatus');
const { sendFailure } = require('../utils/apiResponse');

//-----------------------------------------------------\\
//                      ROLE GUARD
//-----------------------------------------------------\\

//runs after the auth guard and reads the role out of the verified claims, so
//a caller cannot widen their own permissions by changing what they send
//a known caller holding the wrong role is forbidden rather than unauthorised,
//the difference being that signing in again would not help them
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.auth) {
    return sendFailure(res, httpStatus.UNAUTHORIZED, 'authentication is required');
  }

  if (!allowedRoles.includes(req.auth.role)) {
    return sendFailure(
      res,
      httpStatus.FORBIDDEN,
      'you do not have permission to access this resource'
    );
  }

  return next();
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = {
  authorizeRoles
};
