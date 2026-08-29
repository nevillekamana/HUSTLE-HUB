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

dotenv.config({
  path: path.join(__dirname, '..', '.env'),
  quiet: true
});


//-----------------------------------------------------\\
//                        HELPERS
//-----------------------------------------------------\\

const readNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);

  return Number.isNaN(parsed)
    ? fallback
    : parsed;
};


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

  jwtSecret: requireEnv('JWT_SECRET'),


  //---------------------------------------------------\\
  //                   HTTPS / SSL
  //---------------------------------------------------\\

  sslPfxPassword: requireEnv('SSL_PFX_PASSWORD')
};


//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = env;