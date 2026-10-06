//-----------------------------------------------------\\
//                    SEAM — ROLE 2 OWNS THIS
//-----------------------------------------------------\\
//role 1 defines the interface only, role 2 implements the internals

//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const rateLimit = require('express-rate-limit');
const httpStatus = require('../utils/httpStatus');
const { sendFailure } = require('../utils/apiResponse');

//-----------------------------------------------------\\
//                   LOGIN RATE LIMIT
//-----------------------------------------------------\\

//a password guess is cheap for an attacker and expensive for us, capping the
//attempts one client may make in a window is what makes guessing impractical
const LOGIN_WINDOW_MS = 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;

//the refusal goes through the shared sender so a throttled caller receives the
//same envelope as every other failure rather than the library default
const loginRateLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  max: LOGIN_MAX_ATTEMPTS,

  //only a failed attempt counts, brute force is made of failures and someone
  //signing in correctly several times should not be locked out for it
  skipSuccessfulRequests: true,

  //the standard headers tell an honest client when it may retry
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) =>
    sendFailure(
      res,
      httpStatus.TOO_MANY_REQUESTS,
      'too many login attempts, please try again shortly'
    )
});

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = {
  loginRateLimiter
};
