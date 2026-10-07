//------------------------------------------------\\
//                RATE LIMITING
//------------------------------------------------\\

const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const httpStatus = require('../utils/httpStatus');
const { sendFailure } = require('../utils/apiResponse');
const { RATE_LIMITS } = require('../config/security');

const plural = (count, word) => count + ' ' + word + (count === 1 ? '' : 's');

//"1 minute", "15 minutes" or "30 seconds"
const describeWindow = (windowMs) => {
  const seconds = Math.round(windowMs / 1000);
  return seconds % 60 === 0 ? plural(seconds / 60, 'minute') : plural(seconds, 'second');
};

//whole seconds until the caller may try again, never less than one
const secondsUntilReset = (req, windowMs) => {
  const resetTime = req.rateLimit && req.rateLimit.resetTime;
  const remaining = resetTime instanceof Date ? resetTime.getTime() - Date.now() : windowMs;
  return Math.max(1, Math.ceil(remaining / 1000));
};

//every limiter answers a blocked request the same way: 429, a
//Retry-After header, and a message that states the limit and the wait
const buildLimiter = ({ limit, message, countSuccessful = true, keyGenerator }) =>
  rateLimit({
    windowMs: limit.windowMs,
    limit: limit.max,
    skipSuccessfulRequests: !countSuccessful,
    //RateLimit-* headers tell a well behaved client how much is left
    standardHeaders: true,
    legacyHeaders: false,
    //a cors preflight carries no data and is never counted
    skip: (req) => req.method === 'OPTIONS',
    ...(keyGenerator ? { keyGenerator } : {}),
    handler: (req, res) => {
      const retryAfter = secondsUntilReset(req, limit.windowMs);
      res.setHeader('Retry-After', String(retryAfter));
      return sendFailure(res, httpStatus.TOO_MANY_REQUESTS, message, [
        {
          field: 'rateLimit',
          message:
            'limit of ' +
            plural(limit.max, 'request') +
            ' per ' +
            describeWindow(limit.windowMs) +
            ' reached, try again in ' +
            plural(retryAfter, 'second')
        }
      ]);
    }
  });

//------------------------------------------------\\
//                  LIMITERS
//------------------------------------------------\\

//a ceiling on all traffic from one address, applied to the whole api
const apiRateLimiter = buildLimiter({
  limit: RATE_LIMITS.api,
  message: 'too many requests, please slow down'
});

//only failed attempts are counted, so signing in correctly never
//locks anyone out but guessing passwords is stopped quickly
const loginRateLimiter = buildLimiter({
  limit: RATE_LIMITS.login,
  message: 'too many login attempts, please try again shortly',
  countSuccessful: false
});

//stops one address from creating accounts in bulk, or from probing
//which email addresses are already registered
const registerRateLimiter = buildLimiter({
  limit: RATE_LIMITS.register,
  message: 'too many registration attempts, please try again later'
});

//counted per signed in user rather than per address, so it must be
//placed after requireAuth on the booking route. the address is the
//fallback, passed through ipKeyGenerator so ipv6 users share a subnet key
const bookingRateLimiter = buildLimiter({
  limit: RATE_LIMITS.booking,
  message: 'too many bookings in a short time, please try again shortly',
  keyGenerator: (req) =>
    req.auth && req.auth.id ? 'user:' + req.auth.id : ipKeyGenerator(req.ip)
});

//------------------------------------------------\\
//                    EXPORTS
//------------------------------------------------\\

module.exports = {
  apiRateLimiter,
  loginRateLimiter,
  registerRateLimiter,
  bookingRateLimiter
};
