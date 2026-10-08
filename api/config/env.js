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

//no database address is ever committed, an unset one outside development
//means the api would silently bind to whatever is on localhost, so it is
//treated the same way as a missing secret
const readMongoUri = (value, nodeEnv) => {
  if (value) {
    return value;
  }

  if (nodeEnv !== 'development') {
    console.error('[config] MONGO_URI is not set and NODE_ENV is ' + nodeEnv + ', refusing to start');
    process.exit(1);
  }

  return 'mongodb://127.0.0.1:27017/hustlehub';
};

//only 'true' switches it on, so a typo or an unset value fails closed rather
//than trusting a client supplied address by accident
const readTrustProxy = (value) => value === 'true';

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
  sslPfxPassword: process.env.SSL_PFX_PASSWORD || '',

  mongoUri: readMongoUri(process.env.MONGO_URI, nodeEnv),

  //express trusts a client supplied X-Forwarded-For header once this is on,
  //which only belongs behind a real reverse proxy terminating tls in front of
  //the api, with nothing in front of it locally an attacker can claim a new
  //address on every request and walk straight through an ip keyed rate limit
  trustProxy: readTrustProxy(process.env.TRUST_PROXY),

  //read only by scripts/seedAdmin.js, left empty rather than defaulted
  //because an admin account is provisioned by whoever runs the script, not
  //guessed at by the api
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  adminFullName: process.env.ADMIN_FULL_NAME || ''
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = env;
