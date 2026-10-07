//------------------------------------------------\\
//            ROUTE POLICY ENFORCEMENT
//------------------------------------------------\\
//mounted once on /api, after the token check. it finds the row in
//config/routePolicy.js that matches the request and runs, in order:
//the role check, the id check and the row's own checks (rate limit,
//validation). only then does the request reach the route, which is
//left with the ownership check in its database query.
//a request that matches no row carries on with the token check alone

const ROUTE_POLICY = require('../config/routePolicy');
const { authorizeRoles } = require('./roleMiddleware');
const { validateIdParam } = require('./resourceValidation');

//'/Gigs/abc/' and '/gigs/abc' are the same address to express, so
//they must be the same address here: empty parts are dropped, text is
//decoded and compared in lower case
const decode = (part) => {
  try {
    return decodeURIComponent(part);
  } catch (error) {
    return part;
  }
};

const toParts = (path) => path.split('/').filter(Boolean).map(decode);

//returns the ids found in the address when it matches, otherwise null
const toMatcher = (path) => {
  const coversBelow = path.endsWith('/*');
  const wanted = toParts(coversBelow ? path.slice(0, -2) : path);
  return (given) => {
    if (coversBelow ? given.length < wanted.length : given.length !== wanted.length) {
      return null;
    }
    const params = {};
    for (let index = 0; index < wanted.length; index += 1) {
      if (wanted[index].startsWith(':')) {
        params[wanted[index].slice(1)] = given[index];
      } else if (wanted[index].toLowerCase() !== given[index].toLowerCase()) {
        return null;
      }
    }
    return params;
  };
};

//built once at start up, so a mistake in the policy stops the server
//instead of quietly leaving a route open
const RULES = ROUTE_POLICY.map((row) => ({
  method: row.method.toUpperCase(),
  match: toMatcher(row.path),
  checkRole: authorizeRoles(...row.roles),
  checks: row.checks || []
}));

//runs the handlers one after another and stops at the first that answers
const runInOrder = (handlers, req, res, next) => {
  const step = (index) => (error) => {
    if (error || index === handlers.length) {
      return next(error);
    }
    return handlers[index](req, res, step(index + 1));
  };
  return step(0)();
};

const enforceRoutePolicy = (req, res, next) => {
  //a cors preflight carries no token, the real request that follows is checked
  if (req.method === 'OPTIONS') {
    return next();
  }
  //a HEAD request is a GET without the body
  const method = req.method === 'HEAD' ? 'GET' : req.method;
  const given = toParts(req.path);
  for (const rule of RULES) {
    const params = rule.method === '*' || rule.method === method ? rule.match(given) : null;
    if (params) {
      const idChecks = Object.keys(params).map(
        (name) => (request, response, done) => validateIdParam(name)({ params }, response, done)
      );
      return runInOrder([rule.checkRole, ...idChecks, ...rule.checks], req, res, next);
    }
  }
  return next();
};

//------------------------------------------------\\
//                    EXPORTS
//------------------------------------------------\\

module.exports = enforceRoutePolicy;
