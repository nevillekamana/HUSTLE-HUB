//------------------------------------------------\\
//                 ROUTE POLICY
//------------------------------------------------\\
//one row per protected endpoint: which roles may call it and which
//checks run before the route does. the paths are the ones the frontend
//calls (client/src/api/endpoints.js), written as they appear after /api.
//rows are read from the top and the first match wins, so a fixed path
//such as /gigs/mine comes before /gigs/:id. a part that starts with ':'
//is an id and must be well formed. a path ending in /* covers
//everything below it, and method '*' covers every method.
//the policy is enforced in middleware/routeGuard.js for every request,
//so a route cannot be added without its role check and validation

const { PERMISSIONS } = require('./accessPolicy');
const { bookingRateLimiter } = require('../middleware/rateLimitMiddleware');
const {
  validateGigCreate,
  validateGigUpdate,
  validateBookingCreate,
  validateGigQuery,
  validatePaging
} = require('../middleware/resourceValidation');
const { validateTaxQuery, validateAuditQuery } = require('../middleware/auditValidation');

//the roles behind one or more permissions from config/accessPolicy.js
const allow = (...permissions) => {
  const roles = permissions.flatMap((name) => {
    if (!PERMISSIONS[name]) {
      throw new Error('the route policy uses an unknown permission: ' + name);
    }
    return PERMISSIONS[name];
  });
  return [...new Set(roles)];
};

const ROUTE_POLICY = Object.freeze([
  //gigs: everyone signed in may browse, freelancers sell, and a gig is
  //removed by its owner or by an admin
  { method: 'GET', path: '/gigs', roles: allow('gigs:browse'), checks: [validateGigQuery] },
  { method: 'GET', path: '/gigs/mine', roles: allow('gigs:manage-own') },
  { method: 'GET', path: '/gigs/:id', roles: allow('gigs:browse') },
  { method: 'POST', path: '/gigs', roles: allow('gigs:create'), checks: [validateGigCreate] },
  { method: 'PUT', path: '/gigs/:id', roles: allow('gigs:manage-own'), checks: [validateGigUpdate] },
  { method: 'PATCH', path: '/gigs/:id', roles: allow('gigs:manage-own'), checks: [validateGigUpdate] },
  { method: 'DELETE', path: '/gigs/:id', roles: allow('gigs:manage-own', 'gigs:moderate') },

  //bookings: only clients book, and the rate limit runs before validation
  //so that malformed attempts are counted too
  { method: 'POST', path: '/bookings', roles: allow('bookings:create'), checks: [bookingRateLimiter, validateBookingCreate] },
  { method: 'GET', path: '/bookings/mine', roles: allow('bookings:view-own') },
  { method: 'GET', path: '/bookings/:id', roles: allow('bookings:view-own') },

  //money: both sides see their own records, income belongs to freelancers
  //and the full transaction list belongs to admins
  { method: 'GET', path: '/transactions/mine', roles: allow('transactions:view-own') },
  { method: 'GET', path: '/income/me', roles: allow('income:view-own') },
  { method: 'GET', path: '/income/tax', roles: allow('income:view-own'), checks: [validateTaxQuery] },
  { method: 'GET', path: '/transactions', roles: allow('admin:access'), checks: [validatePaging] },

  //administration: everything under /admin, whatever the method
  { method: 'GET', path: '/admin/users', roles: allow('admin:access'), checks: [validatePaging] },
  { method: 'GET', path: '/admin/audit-logs', roles: allow('admin:access'), checks: [validateAuditQuery] },
  { method: '*', path: '/admin/*', roles: allow('admin:access') }
]);

//------------------------------------------------\\
//                    EXPORTS
//------------------------------------------------\\

module.exports = ROUTE_POLICY;
