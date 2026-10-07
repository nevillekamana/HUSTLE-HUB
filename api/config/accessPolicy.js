//------------------------------------------------\\
//                ACCESS POLICY
//------------------------------------------------\\
//one place that states who may do what. routes ask for a permission
//by name, so changing a rule here changes it everywhere

const userModel = require('../models/userModel');

//the role names come from the user model so there is one source of truth
const ROLES = Object.freeze({
  CLIENT: 'client',
  FREELANCER: 'freelancer',
  ADMIN: 'admin',
  ...(userModel.ROLES || {})
});

const ALL_ROLES = Object.freeze(Object.values(ROLES));

//------------------------------------------------\\
//                PUBLIC ROUTES
//------------------------------------------------\\

//every api route needs a valid token unless it is listed here.
//paths are written as they appear after /api, and :name matches one
//path segment (for example '/gigs/:id')
const PUBLIC_ROUTES = Object.freeze([
  { method: 'GET', path: '/health' },
  { method: 'POST', path: '/auth/register' },
  { method: 'POST', path: '/auth/login' }
]);

//------------------------------------------------\\
//                 PERMISSIONS
//------------------------------------------------\\

const PERMISSIONS = Object.freeze({
  //gigs: anyone signed in may look, only freelancers may sell
  'gigs:browse': ALL_ROLES,
  'gigs:create': [ROLES.FREELANCER],
  'gigs:manage-own': [ROLES.FREELANCER],
  'gigs:moderate': [ROLES.ADMIN],

  //bookings: only clients buy, both sides may see their own
  'bookings:create': [ROLES.CLIENT],
  'bookings:view-own': [ROLES.CLIENT, ROLES.FREELANCER],

  //money: both sides see their own records, income belongs to freelancers
  'transactions:view-own': [ROLES.CLIENT, ROLES.FREELANCER],
  'income:view-own': [ROLES.FREELANCER],

  //administration
  'admin:access': [ROLES.ADMIN]
});

//------------------------------------------------\\
//                    EXPORTS
//------------------------------------------------\\

module.exports = {
  ROLES,
  ALL_ROLES,
  PUBLIC_ROUTES,
  PERMISSIONS
};
