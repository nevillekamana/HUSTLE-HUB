//-----------------------------------------------------\\
//              HUSTLEHUB PLUS - ROLE 2
//              SECURITY SPECIALIST
//
//              Student Number: ST10257779
//-----------------------------------------------------\\


//-----------------------------------------------------\\
//                 ROLE AUTHORIZATION
//-----------------------------------------------------\\

/**
 * Restricts a route to specific user roles.
 *
 * Example:
 *
 * authorizeRoles('admin')
 *
 * authorizeRoles('client', 'freelancer')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {

    // The authentication middleware must run first
    // so that req.user contains the decoded JWT.
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication is required'
      });
    }

    // Reject users whose role is not permitted
    // to access the requested resource.
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};


//-----------------------------------------------------\\
//                       EXPORTS
//-----------------------------------------------------\\

module.exports = {
  authorizeRoles
};