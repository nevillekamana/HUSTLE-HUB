//------------------------------------------------\\
//          AUTHENTICATION BY DEFAULT
//------------------------------------------------\\
//mounted once on /api, so a new route is protected the moment it is
//added. a route is only open without a token when it is listed in
//PUBLIC_ROUTES, which means forgetting requireAuth can never expose data

const requireAuth = require('./requireAuth');
const { PUBLIC_ROUTES } = require('../config/accessPolicy');

const escapePattern = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

//'/gigs/:id' becomes a pattern where :id matches one path segment
const toPattern = (path) =>
  new RegExp(
    '^' +
      path
        .replace(/\/+$/, '')
        .split('/')
        .map((part) => (part.startsWith(':') ? '[^/]+' : escapePattern(part)))
        .join('/') +
      '/?$',
    'i'
  );

const PUBLIC_MATCHERS = PUBLIC_ROUTES.map((route) => ({
  method: route.method.toUpperCase(),
  pattern: toPattern(route.path)
}));

const isPublic = (req) => {
  //a HEAD request is a GET without the body
  const method = req.method === 'HEAD' ? 'GET' : req.method;
  return PUBLIC_MATCHERS.some(
    (route) => route.method === method && route.pattern.test(req.path)
  );
};

const requireAuthByDefault = (req, res, next) => {
  //a cors preflight never carries a token, the real request that
  //follows it is checked
  if (req.method === 'OPTIONS' || isPublic(req)) {
    return next();
  }
  return requireAuth(req, res, next);
};

//------------------------------------------------\\
//                    EXPORTS
//------------------------------------------------\\

module.exports = requireAuthByDefault;
