//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const httpStatus = require('../utils/httpStatus');
const { sendSuccess, sendFailure } = require('../utils/apiResponse');
const { hashPassword } = require('../services/passwordService');
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
const REQUIRED_FIELDS = ['fullName', 'email', 'password'];

//a field that is absent, blank, or not a string all fail the same way, so a
//number or an object cannot slip past a truthiness check
const findMissingFields = (body) =>
  REQUIRED_FIELDS.filter(
    (field) => typeof body[field] !== 'string' || body[field].trim() === ''
  );

//-----------------------------------------------------\\
//                     REGISTRATION
//-----------------------------------------------------\\

//creates an account and answers with the safe user object, never the record
//as stored, so the password hash cannot reach the client
const register = async (req, res) => {
  const body = req.body || {};
  const missing = findMissingFields(body);

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
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = {
  register
};
