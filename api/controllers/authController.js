//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const httpStatus = require('../utils/httpStatus');
const { sendSuccess, sendFailure } = require('../utils/apiResponse');
const { hashPassword, verifyPassword } = require('../services/passwordService');
const { generateToken } = require('../services/tokenService');
const {
  ROLES,
  SELF_ASSIGNABLE_ROLES,
  EMAIL_TAKEN,
  isValidRole,
  createUser,
  findUserByEmail,
  findUserById,
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

//an absent role registers a client, anything else is honoured only when it is
//one a person may choose for themselves
//admin is a real stored role but is deliberately not in the assignable list,
//so it cannot be reached through this endpoint whatever the body asks for
const resolveRole = (requested) => {
  if (requested === undefined) {
    return ROLES.CLIENT;
  }

  return isValidRole(requested) ? requested : null;
};

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

  const role = resolveRole(body.role);

  if (role === null) {
    return sendFailure(
      res,
      httpStatus.BAD_REQUEST,
      'the requested role is not valid',
      [
        {
          field: 'role',
          message: 'must be one of ' + SELF_ASSIGNABLE_ROLES.join(' or ')
        }
      ]
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
      role
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
//                   PROTECTED ROUTES
//-----------------------------------------------------\\

//returns the account behind the token, the identifier is taken from the
//verified claims and never from the url or the body, so one caller cannot ask
//for another account by changing what they send
const profile = async (req, res) => {
  const user = await findUserById(req.auth.id);

  if (!user) {
    //the signature was good but the account behind it is gone, which is a
    //missing resource rather than a rejected credential
    return sendFailure(res, httpStatus.NOT_FOUND, 'the account no longer exists');
  }

  return sendSuccess(res, httpStatus.OK, 'profile retrieved', {
    user: toPublicUser(user)
  });
};

//demonstrates a role restricted endpoint, the guards in the router do the
//deciding, reaching this handler at all is the proof that they passed
//no account can register as an admin, so in part 1 this exists to show the
//refusal path working rather than the success path
const adminArea = async (req, res) =>
  sendSuccess(res, httpStatus.OK, 'admin area accessed', {
    id: req.auth.id,
    role: req.auth.role
  });

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = {
  register,
  login,
  profile,
  adminArea
};
