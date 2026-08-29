//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const httpStatus = require('../utils/httpStatus');
const { sendSuccess, sendFailure } = require('../utils/apiResponse');
const { hashPassword, verifyPassword } = require('../services/passwordService');
const { generateToken } = require('../services/tokenService');
const {
  ROLES,
  EMAIL_TAKEN,
  createUser,
  findUserByEmail,
  toPublicUser
} = require('../models/userModel');

//-----------------------------------------------------\\
//                    REQUEST CHECKS
//-----------------------------------------------------\\

//the minimum the endpoint needs to behave, role 2 owns the real rules for
//format, length and strength and will front this with validation middleware
const REGISTER_FIELDS = ['fullName', 'email', 'password'];
const LOGIN_FIELDS = ['email', 'password'];

//a field that is absent, blank, or not a string all fail the same way, so a
//number or an object cannot slip past a truthiness check
const findMissingFields = (body, fields) =>
  fields.filter(
    (field) => typeof body[field] !== 'string' || body[field].trim() === ''
  );

//-----------------------------------------------------\\
//                     REGISTRATION
//-----------------------------------------------------\\

//creates an account and answers with the safe user object, never the record
//as stored, so the password hash cannot reach the client
const register = async (req, res) => {
  const body = req.body || {};
  const missing = findMissingFields(body, REGISTER_FIELDS);

  if (missing.length > 0) {
    return sendFailure(
      res,
      httpStatus.BAD_REQUEST,
      'required fields are missing',
      missing.map((field) => ({ field, message: 'is required' }))
    );
  }

  //looked up before hashing so an obvious duplicate does not pay for a bcrypt run
  const existing = await findUserByEmail(body.email);

  if (existing) {
    return sendFailure(res, httpStatus.CONFLICT, 'email already registered');
  }

  //the plain password travels no further than this line, only the hash is passed on
  const passwordHash = await hashPassword(body.password);

  try {
    const user = await createUser({
      fullName: body.fullName,
      email: body.email,
      passwordHash,
      //choosing a role is added by the commit that follows, until then every
      //registration is a client, and a role sent in the body is ignored
      role: ROLES.CLIENT
    });

    return sendSuccess(res, httpStatus.CREATED, 'user registered successfully', {
      user: toPublicUser(user)
    });
  } catch (error) {
    //the model closes the gap between the lookup above and the insert, a second
    //request for the same address arriving in between lands here
    if (error.code === EMAIL_TAKEN) {
      return sendFailure(res, httpStatus.CONFLICT, 'email already registered');
    }

    throw error;
  }
};

//-----------------------------------------------------\\
//                         LOGIN
//-----------------------------------------------------\\

//verifies a credential pair and issues a token, the reply carries the safe
//user object and nothing that could be replayed except the token itself
const login = async (req, res) => {
  const body = req.body || {};
  const missing = findMissingFields(body, LOGIN_FIELDS);

  if (missing.length > 0) {
    return sendFailure(
      res,
      httpStatus.BAD_REQUEST,
      'required fields are missing',
      missing.map((field) => ({ field, message: 'is required' }))
    );
  }

  const user = await findUserByEmail(body.email);

  //an unknown address and a wrong password give the same answer, telling them
  //apart would let anyone work out which addresses hold accounts
  //note for role 2, the two still take different amounts of time because a
  //miss never reaches bcrypt, equalising that is a hardening step
  const matches = user ? await verifyPassword(body.password, user.passwordHash) : false;

  if (!matches) {
    return sendFailure(res, httpStatus.UNAUTHORIZED, 'invalid email or password');
  }

  //only an identifier and a role go into the token, a jwt payload is readable
  //by anyone holding it
  const token = generateToken({ id: user.id, role: user.role });

  return sendSuccess(res, httpStatus.OK, 'login successful', {
    user: toPublicUser(user),
    token
  });
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = {
  register,
  login
};
