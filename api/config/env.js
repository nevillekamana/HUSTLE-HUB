//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const path = require('path');
const dotenv = require('dotenv');

//-----------------------------------------------------\\
//                  ENVIRONMENT LOADING
//-----------------------------------------------------\\

//resolved from this file rather than the working directory so the api boots
//the same way whether it is started from the repo root or from api
//quiet suppresses the dotenv startup banner so the boot log stays clean
dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });

//-----------------------------------------------------\\
//                        HELPERS
//-----------------------------------------------------\\

//env values arrive as strings, an unset or non numeric value falls back
//rather than silently binding the server to port NaN
const readNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

//-----------------------------------------------------\\
//                     CONFIGURATION
//-----------------------------------------------------\\

//the single source of truth for environment values, nothing else in the api
//should read process.env directly
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: readNumber(process.env.PORT, 5000)
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = env;
