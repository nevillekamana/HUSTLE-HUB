//------------------------------------------------\\
//               SECURITY SETTINGS
//------------------------------------------------\\

//env is loaded first so the .env file has been read before any
//value below is taken from process.env
require('./env');

const SECOND = 1000;
const MINUTE = 60 * SECOND;

const isProduction = (process.env.NODE_ENV || 'development') === 'production';

//a setting that is missing or is not a positive whole number falls
//back to the default, so a typo in .env can never switch a limit off
const readLimit = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const limit = (prefix, windowMs, max) =>
  Object.freeze({
    windowMs: readLimit(process.env['RATE_LIMIT_' + prefix + '_WINDOW_MS'], windowMs),
    max: readLimit(process.env['RATE_LIMIT_' + prefix + '_MAX'], max)
  });

//------------------------------------------------\\
//                  RATE LIMITS
//------------------------------------------------\\

const RATE_LIMITS = Object.freeze({
  //every request to the api, counted per ip address
  api: limit('API', MINUTE, 300),
  //failed sign in attempts, counted per ip address
  login: limit('LOGIN', MINUTE, 5),
  //registration attempts, counted per ip address
  register: limit('REGISTER', 15 * MINUTE, 30),
  //bookings, counted per signed in user
  booking: limit('BOOKING', MINUTE, 10)
});

//------------------------------------------------\\
//            CONTENT SECURITY POLICY
//------------------------------------------------\\

//the api only ever answers with json, so nothing at all may be loaded,
//framed, submitted or run from one of its responses
const CONTENT_SECURITY_POLICY = Object.freeze({
  defaultSrc: ["'none'"],
  baseUri: ["'none'"],
  formAction: ["'none'"],
  frameAncestors: ["'none'"],
  sandbox: []
});

//browser features the api never needs are switched off outright
const PERMISSIONS_POLICY =
  'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()';

//hsts is only sent in production: on localhost it would force every
//local port, including the react dev server, onto https
const HSTS = isProduction ? { maxAge: 180 * 24 * 60 * 60, includeSubDomains: true } : false;

//------------------------------------------------\\
//                  SANITISING
//------------------------------------------------\\

const SANITISER = Object.freeze({
  //passwords are hashed and never shown, so they are left exactly as
  //typed: changing a character would stop the user signing in
  untouchedFields: Object.freeze(['password', 'currentPassword', 'newPassword', 'confirmPassword']),
  //deeper json than this is refused instead of being walked
  maxDepth: 8
});

//------------------------------------------------\\
//                    EXPORTS
//------------------------------------------------\\

module.exports = {
  isProduction,
  RATE_LIMITS,
  CONTENT_SECURITY_POLICY,
  PERMISSIONS_POLICY,
  HSTS,
  SANITISER
};
