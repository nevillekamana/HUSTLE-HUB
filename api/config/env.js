//-----------------------------------------------------\\
//              HUSTLEHUB PLUS - ROLE 2
//              SECURITY SPECIALIST
//
//              Student Number: ST10257779
//-----------------------------------------------------\\


//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const path = require('path');
const dotenv = require('dotenv');


//-----------------------------------------------------\\
//                  ENVIRONMENT LOADING
//-----------------------------------------------------\\

// Load environment variables from the .env file located
// inside the api folder.
//
// Resolving the path from this file ensures that the API
// loads the same environment file regardless of where
// the application is started from.
dotenv.config({
  path: path.join(__dirname, '..', '.env'),
  quiet: true
});


//-----------------------------------------------------\\
//                        HELPERS
//-----------------------------------------------------\\

/**
 * Safely converts an environment value into a number.
 *
 * If the value is missing or invalid, the supplied
 * fallback value is returned instead.
 */
const readNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);

  return Number.isNaN(parsed)
    ? fallback
    : parsed;
};


//-----------------------------------------------------\\
//                 REQUIRED VALUE CHECK
//-----------------------------------------------------\\

/**
 * Ensures that an important environment variable exists.
 *
 * Security-sensitive configuration should never silently
 * fall back to a weak or hard-coded value.
 */
const requireEnv = (name) => {
  const value = process.env[name];

  if (!value || !String(value).trim()) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return String(value).trim();
};


//-----------------------------------------------------\\
//                     CONFIGURATION
//-----------------------------------------------------\\

// This object acts as the single source of truth for
// environment configuration used throughout the API.
//
// Other application files should import values from here
// instead of reading process.env directly.
const env = {
  //---------------------------------------------------\\
  //                  APPLICATION
  //---------------------------------------------------\\

  nodeEnv: process.env.NODE_ENV || 'development',

  port: readNumber(
    process.env.PORT,
    5000
  ),


  //---------------------------------------------------\\
  //                JWT AUTHENTICATION
  //---------------------------------------------------\\

  // Secret used to sign and verify JSON Web Tokens.
  //
  // The actual secret is stored inside api/.env and
  // should never be hard-coded into application source.
  jwtSecret: requireEnv('JWT_SECRET')
};


//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = env;