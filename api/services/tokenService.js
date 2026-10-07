//-----------------------------------------------------\\
//                    SEAM — ROLE 2 OWNS THIS
//-----------------------------------------------------\\
//role 1 defines the interface only, role 2 implements the internals

//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const jwt = require('jsonwebtoken');
const env = require('../config/env');

//-----------------------------------------------------\\
//                    TOKEN HANDLING
//-----------------------------------------------------\\

//signs the payload and stamps it with the configured lifetime
//a jwt payload is base64, not encrypted, so anyone holding the token can read
//it, keep the payload to an identifier and a role and never put a secret in it
const generateToken = (payload) =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

//returns the decoded payload, or throws when the token is missing, altered,
//expired or signed with a different secret
//it throws rather than returning null so a caller cannot forget to check, the
//auth middleware catches it and answers with a 401
//only the algorithm the tokens are signed with is accepted
const verifyToken = (token) => jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = {
  generateToken,
  verifyToken
};
