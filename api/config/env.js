//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const { randomBytes } = require('crypto');
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

//a work factor below this is not worth having, an environment that asks for
//less is raised to it rather than trusted
const MINIMUM_BCRYPT_ROUNDS = 10;

const readRounds = (value, fallback) =>
  Math.max(readNumber(value, fallback), MINIMUM_BCRYPT_ROUNDS);

//no signing secret is ever committed, so an unset one is generated for this
//process alone, that lets a fresh clone boot without a .env while making the
//omission obvious, every token stops verifying the moment the process restarts
const readSecret = (value, nodeEnv) => {
  if (value) {
    return value;
  }
  //outside development a generated secret is worse than no start at all, every
  //token would stop verifying on each restart and nobody would be told why
  if (nodeEnv !== 'development') {
    console.error(
      '[config] JWT_SECRET is not set and NODE_ENV is ' +
        nodeEnv +
        ', refusing to start with a generated secret'
    );

    process.exit(1);
  }

  console.warn(
    '[config] JWT_SECRET is not set, generating one for this process only'
  );

  return randomBytes(32).toString('hex');
};

//-----------------------------------------------------\\
//                     CONFIGURATION
//-----------------------------------------------------\\

//resolved once and shared, so the value the secret check reads is the same one
//the rest of the api sees, an unset NODE_ENV means development here
const nodeEnv = process.env.NODE_ENV || 'development';

//the single source of truth for environment values, nothing else in the api
//should read process.env directly
const env = {
  nodeEnv,
  port: readNumber(process.env.PORT, 5000),
  jwtSecret: readSecret(process.env.JWT_SECRET, nodeEnv),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  bcryptRounds: readRounds(process.env.BCRYPT_ROUNDS, 12),

  //the certificate is never committed, an absent one is not an error, the
  //server falls back to http and says so rather than refusing to start
  sslPfxPath:
    process.env.SSL_PFX_PATH || path.join(__dirname, '..', 'certs', 'localhost.pfx'),
  sslPfxPassword: process.env.SSL_PFX_PASSWORD || ''
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = env;
