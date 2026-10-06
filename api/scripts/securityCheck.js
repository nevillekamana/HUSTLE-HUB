//------------------------------------------------\\
//             SECURITY SELF CHECK
//------------------------------------------------\\
//run with: npm run security:check
//starts the api on a spare port, sends real requests at every security
//control and reports what each one did. nothing is saved: no user,
//gig or booking is created

//two limits are lowered for this run only, so they can be reached
//with a handful of requests. they must be set before the app loads
process.env.RATE_LIMIT_REGISTER_MAX = '3';
process.env.RATE_LIMIT_BOOKING_MAX = '3';

//blocked requests are logged as warnings, which would clutter this report
console.warn = () => {};

const http = require('http');
const express = require('express');
const jwt = require('jsonwebtoken');
const app = require('../app');
const env = require('../config/env');
const { generateToken } = require('../services/tokenService');
const { ROLES } = require('../config/accessPolicy');
const { protect, authorizeOwner } = require('../middleware/roleMiddleware');
const { bookingRateLimiter } = require('../middleware/rateLimitMiddleware');
const { sanitizeRequest, cleanText } = require('../middleware/sanitizeMiddleware');
const {
  validateGigCreate,
  validateGigUpdate,
  validateBookingCreate,
  validateIdParam,
  validateGigQuery
} = require('../middleware/resourceValidation');

const results = [];
const check = (name, passed, detail) => {
  results.push(passed);
  console.log((passed ? '  PASS  ' : '  FAIL  ') + name + (passed || !detail ? '' : '  -> ' + detail));
};

const tokenFor = (id, role) => generateToken({ id, role });
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');

//------------------------------------------------\\
//   A SMALL APP FOR ROUTES THAT DO NOT EXIST YET
//------------------------------------------------\\
//gig and booking routes are still being built, so the same guards
//they will use are mounted here on stand-in routes

const GIG_OWNERS = { 'gig-1': 'freelancer-1' };
const done = (req, res) => res.status(200).json({ success: true, body: req.body });

const standIn = express();
standIn.set('trust proxy', 1);
standIn.use(express.json());
standIn.use(sanitizeRequest);
standIn.post('/echo', done);
standIn.post('/gigs', protect('gigs:create'), done);
standIn.delete(
  '/gigs/:id',
  protect('gigs:manage-own'),
  authorizeOwner(async (req) => GIG_OWNERS[req.params.id] || null),
  done
);
standIn.post('/bookings', protect('bookings:create'), bookingRateLimiter, done);
//the validators on their own, so each rule can be tried without a token
const listed = (req, res) => res.status(200).json({ success: true, paging: req.paging, filters: req.filters });
standIn.get('/checked/gigs', validateGigQuery, listed);
standIn.post('/checked/gigs', validateGigCreate, done);
standIn.put('/checked/gigs/:id', validateIdParam('id'), validateGigUpdate, done);
standIn.post('/checked/bookings', validateBookingCreate, done);

//------------------------------------------------\\
//                   HELPERS
//------------------------------------------------\\

const listen = (handler) =>
  new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });

const caller = (server) => async (method, path, { token, body, rawBody } = {}) => {
  const headers = {};
  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }
  if (body !== undefined || rawBody !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch('http://127.0.0.1:' + server.address().port + path, {
    method,
    headers,
    body: rawBody !== undefined ? rawBody : body !== undefined ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (error) {
    json = null;
  }
  return { status: response.status, headers: response.headers, json: json || {} };
};

//------------------------------------------------\\
//                   CHECKS
//------------------------------------------------\\

const run = async () => {
  const apiServer = await listen(app);
  const standInServer = await listen(standIn);
  const api = caller(apiServer);
  const side = caller(standInServer);

  console.log('');
  console.log('HustleHub+ security check');
  console.log('');
  console.log(' Security headers (Helmet + CSP)');
  const health = await api('GET', '/api/health');
  const csp = health.headers.get('content-security-policy') || '';
  check('health endpoint still answers', health.status === 200, 'status ' + health.status);
  check("content security policy is default-src 'none'", csp.includes("default-src 'none'"), csp);
  check("content security policy forbids framing", csp.includes("frame-ancestors 'none'"), csp);
  check('X-Frame-Options is DENY', health.headers.get('x-frame-options') === 'DENY');
  check('X-Content-Type-Options is nosniff', health.headers.get('x-content-type-options') === 'nosniff');
  check('Referrer-Policy is no-referrer', health.headers.get('referrer-policy') === 'no-referrer');
  check('Permissions-Policy is set', (health.headers.get('permissions-policy') || '').includes('camera=()'));
  check('responses are not cached', health.headers.get('cache-control') === 'no-store');
  check('X-Powered-By is hidden', health.headers.get('x-powered-by') === null);

  console.log('');
  console.log(' JWT on every route');
  const client = tokenFor('client-1', ROLES.CLIENT);
  const freelancer = tokenFor('freelancer-1', ROLES.FREELANCER);
  const otherFreelancer = tokenFor('freelancer-2', ROLES.FREELANCER);
  const admin = tokenFor('admin-1', ROLES.ADMIN);
  const expired = jwt.sign({ id: 'client-1', role: ROLES.CLIENT }, env.jwtSecret, { expiresIn: -60 });
  const forged = jwt.sign({ id: 'admin-1', role: ROLES.ADMIN }, 'not-the-real-secret-not-the-real-secret');
  const unsigned = encode({ alg: 'none', typ: 'JWT' }) + '.' + encode({ id: 'admin-1', role: ROLES.ADMIN }) + '.';
  const unknownRole = tokenFor('someone', 'superuser');

  check('no token is refused (401)', (await api('GET', '/api/auth/profile')).status === 401);
  check('a malformed token is refused (401)', (await api('GET', '/api/auth/profile', { token: 'not-a-token' })).status === 401);
  check('an expired token is refused (401)', (await api('GET', '/api/auth/profile', { token: expired })).status === 401);
  check('a token signed with another secret is refused (401)', (await api('GET', '/api/auth/admin', { token: forged })).status === 401);
  check('an unsigned (alg none) token is refused (401)', (await api('GET', '/api/auth/admin', { token: unsigned })).status === 401);
  check('a token with an unknown role is refused (401)', (await api('GET', '/api/auth/profile', { token: unknownRole })).status === 401);
  check('a route that is not listed as public needs a token (401)', (await api('GET', '/api/anything-new')).status === 401);
  check('with a token, an unknown route is a plain 404', (await api('GET', '/api/anything-new', { token: client })).status === 404);

  console.log('');
  console.log(' Role based access control');
  check('a client is kept out of the admin area (403)', (await api('GET', '/api/auth/admin', { token: client })).status === 403);
  check('a freelancer is kept out of the admin area (403)', (await api('GET', '/api/auth/admin', { token: freelancer })).status === 403);
  const adminArea = await api('GET', '/api/auth/admin', { token: admin });
  check('an admin is let into the admin area', adminArea.status !== 401 && adminArea.status !== 403, 'status ' + adminArea.status);
  check('a client may not create a gig (403)', (await side('POST', '/gigs', { token: client, body: {} })).status === 403);
  check('a freelancer may create a gig', (await side('POST', '/gigs', { token: freelancer, body: {} })).status === 200);
  check('a freelancer may not make a booking (403)', (await side('POST', '/bookings', { token: freelancer, body: {} })).status === 403);
  check('a guard used without a token answers 401', (await side('POST', '/gigs', { body: {} })).status === 401);
  check('a freelancer may not delete another freelancer\'s gig (403)', (await side('DELETE', '/gigs/gig-1', { token: otherFreelancer })).status === 403);
  check('the owner may delete their own gig', (await side('DELETE', '/gigs/gig-1', { token: freelancer })).status === 200);
  check('a gig that does not exist is a 404', (await side('DELETE', '/gigs/gig-9', { token: freelancer })).status === 404);

  console.log('');
  console.log(' Input sanitisation');
  const operator = await api('POST', '/api/auth/login', { body: { email: { $gt: '' }, password: 'anything' } });
  check('a NoSQL operator in the body is refused (400)', operator.status === 400 && operator.json.message === 'the request contains prohibited characters', 'status ' + operator.status);
  check('a NoSQL operator in the query string is refused (400)', (await api('GET', '/api/health?$where=1')).status === 400);
  const pollution = await api('POST', '/api/auth/login', { rawBody: '{"__proto__":{"role":"admin"},"email":"a@b.co","password":"x"}' });
  check('a prototype pollution key is refused (400)', pollution.status === 400, 'status ' + pollution.status);
  const cleaned = cleanText('<script>alert(1)</script>Logo design<img src=x onerror=alert(1)>');
  check('script and html tags are stripped from text', cleaned === 'Logo design', JSON.stringify(cleaned));
  const echo = await side('POST', '/echo', { body: { title: '<b>Fast</b> logos', password: 'P@ss<w0rd>' } });
  check('text fields are cleaned before a route sees them', echo.json.body && echo.json.body.title === 'Fast logos', JSON.stringify(echo.json.body));
  check('passwords are left exactly as typed', echo.json.body && echo.json.body.password === 'P@ss<w0rd>', JSON.stringify(echo.json.body));

  console.log('');
  console.log(' Input validation');
  const GIG_ID = '64b7f0c2a1d3e4f5a6b7c8d9';
  const goodGig = { title: '  Logo design  ', description: 'A clean logo in three working days', category: 'design', priceCents: 45000 };
  const fields = (answer) => (answer.json.errors || []).map((error) => error.field).sort().join(', ');
  const made = await side('POST', '/checked/gigs', { body: goodGig });
  check('a complete gig is accepted and its text is trimmed', made.status === 200 && made.json.body.title === 'Logo design', JSON.stringify(made.json));
  const badGig = await side('POST', '/checked/gigs', { body: { title: 'ab', description: 'too short', category: 'cars', priceCents: 50 } });
  check('a gig with four bad fields gets four messages (400)', badGig.status === 400 && fields(badGig) === 'category, description, priceCents, title', fields(badGig));
  const textPrice = await side('POST', '/checked/gigs', { body: { ...goodGig, priceCents: '45000' } });
  check('a price sent as text is refused (400)', textPrice.status === 400 && fields(textPrice) === 'priceCents', fields(textPrice));
  const bracket = await side('POST', '/checked/gigs', { body: { ...goodGig, title: 'Fast > cheap logos' } });
  check('a title with a stray > is refused (400)', bracket.status === 400 && fields(bracket) === 'title', fields(bracket));
  const owner = await side('POST', '/checked/gigs', { body: { ...goodGig, freelancer: GIG_ID } });
  check('a caller cannot set the owner of a gig (400)', owner.status === 400 && fields(owner) === 'freelancer', fields(owner));
  check('an update with nothing in it is refused (400)', (await side('PUT', '/checked/gigs/' + GIG_ID, { body: {} })).status === 400);
  check('an update of one field is accepted', (await side('PUT', '/checked/gigs/' + GIG_ID, { body: { isActive: false } })).status === 200);
  const badId = await side('PUT', '/checked/gigs/not-an-id', { body: { isActive: false } });
  check('an address with a malformed id is refused (400)', badId.status === 400 && fields(badId) === 'id', fields(badId));
  check('a booking without a gig id is refused (400)', (await side('POST', '/checked/bookings', { body: {} })).status === 400);
  check('a booking with a malformed gig id is refused (400)', (await side('POST', '/checked/bookings', { body: { gigId: '12345' } })).status === 400);
  check('a booking cannot carry its own price (400)', (await side('POST', '/checked/bookings', { body: { gigId: GIG_ID, priceCents: 1 } })).status === 400);
  check('a booking for a well formed gig id is accepted', (await side('POST', '/checked/bookings', { body: { gigId: GIG_ID } })).status === 200);
  const badList = await side('GET', '/checked/gigs?page=0&limit=1000&category=cars&sort=price');
  check('list options out of range are refused (400)', badList.status === 400 && fields(badList) === 'category, limit, page, sort', fields(badList));
  check('a filter given twice is refused (400)', (await side('GET', '/checked/gigs?category=design&category=writing')).status === 400);
  check('a minimum price above the maximum is refused (400)', (await side('GET', '/checked/gigs?minPrice=900&maxPrice=100')).status === 400);
  const list = await side('GET', '/checked/gigs?page=3&limit=10&category=design&q=logo');
  check('good list options reach the route as checked values', list.status === 200 && list.json.paging.skip === 20 && list.json.filters.category === 'design' && list.json.filters.q === 'logo', JSON.stringify(list.json));

  console.log('');
  console.log(' Rate limiting');
  const wrongLogin = { email: 'security-check@example.invalid', password: 'wrong-password-1' };
  const loginStatuses = [];
  let lastLogin = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    lastLogin = await api('POST', '/api/auth/login', { body: wrongLogin });
    loginStatuses.push(lastLogin.status);
  }
  check('the sixth failed login in a minute is blocked (429)', loginStatuses[4] !== 429 && loginStatuses[5] === 429, loginStatuses.join(', '));
  check('the 429 answer says when to try again', Number(lastLogin.headers.get('retry-after')) >= 1 && lastLogin.json.success === false && Array.isArray(lastLogin.json.errors) && lastLogin.json.errors.length === 1, JSON.stringify(lastLogin.json));
  const registerStatuses = [];
  for (let attempt = 0; attempt < 4; attempt += 1) {
    registerStatuses.push((await api('POST', '/api/auth/register', { body: {} })).status);
  }
  check('registration attempts are limited (429 after the limit)', registerStatuses[2] !== 429 && registerStatuses[3] === 429, registerStatuses.join(', '));
  const bookingStatuses = [];
  for (let attempt = 0; attempt < 4; attempt += 1) {
    bookingStatuses.push((await side('POST', '/bookings', { token: client, body: {} })).status);
  }
  check('bookings are limited per user (429 after the limit)', bookingStatuses[2] === 200 && bookingStatuses[3] === 429, bookingStatuses.join(', '));
  const otherClient = await side('POST', '/bookings', { token: tokenFor('client-2', ROLES.CLIENT), body: {} });
  check('one user reaching the limit does not block another user', otherClient.status === 200, 'status ' + otherClient.status);

  apiServer.close();
  standInServer.close();

  const failed = results.filter((passed) => !passed).length;
  console.log('');
  console.log(results.length - failed + ' passed, ' + failed + ' failed');
  console.log('');
  process.exitCode = failed === 0 ? 0 : 1;
};

run().catch((error) => {
  console.error('the security check could not run:', error);
  process.exit(1);
});
