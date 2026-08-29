//-----------------------------------------------------\\
//              HUSTLEHUB PLUS - ROLE 2
//              SECURITY SPECIALIST
//
//              Student Number: ST10257779
//-----------------------------------------------------\\


//-----------------------------------------------------\\
//                      IMPORTS
//-----------------------------------------------------\\

// express-rate-limit is used to restrict repeated requests
// from the same client within a defined period of time.
const rateLimit = require('express-rate-limit');


//-----------------------------------------------------\\
//                  LOGIN RATE LIMITER
//-----------------------------------------------------\\

/**
 * Protects the login endpoint against repeated attempts.
 *
 * Security responsibilities:
 * - Reduces brute-force password attacks
 * - Limits automated login attempts
 * - Returns HTTP 429 when too many requests are made
 * - Uses standard rate-limit response headers
 */
const loginRateLimiter = rateLimit({

  //---------------------------------------------------\\
  //                    TIME WINDOW
  //---------------------------------------------------\\

  // Login attempts are counted over a 1-minute window.
  windowMs: 60 * 1000,


  //---------------------------------------------------\\
  //                 REQUEST LIMIT
  //---------------------------------------------------\\

  // A client may attempt login a maximum of 5 times
  // during the configured 1-minute window.
  max: 5,


  //---------------------------------------------------\\
  //                    HEADERS
  //---------------------------------------------------\\

  // Send modern RateLimit headers so clients can see
  // information about their current request limit.
  standardHeaders: true,

  // Disable older X-RateLimit-* headers.
  legacyHeaders: false,


  //---------------------------------------------------\\
  //                LIMIT RESPONSE
  //---------------------------------------------------\\

  // This response is returned once the login attempt
  // limit has been exceeded.
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.'
  },


  //---------------------------------------------------\\
  //                  STATUS CODE
  //---------------------------------------------------\\

  // HTTP 429 means Too Many Requests.
  statusCode: 429
});


//-----------------------------------------------------\\
//                       EXPORTS
//-----------------------------------------------------\\

module.exports = {
  loginRateLimiter
};