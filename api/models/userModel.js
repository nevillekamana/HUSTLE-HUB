//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const mongoose = require('mongoose');

//-----------------------------------------------------\\
//                        SCHEMA
//-----------------------------------------------------\\

//the roles a user may hold, admin exists for part 2 but is never assignable
//through the public registration endpoint
const ROLES = {
  CLIENT: 'client',
  FREELANCER: 'freelancer',
  ADMIN: 'admin'
};

//only these two may be chosen by whoever is registering
const SELF_ASSIGNABLE_ROLES = [ROLES.CLIENT, ROLES.FREELANCER];

//the fields a public response may ever carry, the allowlist toPublicUser
//copies from, 'id' is mongoose's own string virtual over _id
const USER_FIELDS = ['id', 'fullName', 'email', 'role', 'createdAt'];
const SENSITIVE_FIELDS = ['passwordHash'];
const PUBLIC_FIELDS = USER_FIELDS.filter((field) => !SENSITIVE_FIELDS.includes(field));

//raised when the address is already registered, the register controller turns
//this into a conflict response so no storage detail reaches the client
const EMAIL_TAKEN = 'EMAIL_TAKEN';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    //unique builds the index that createUser's duplicate check relies on,
    //lowercase and trim run on every save so a differently cased or padded
    //address still collides with the stored one
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254
    },
    //never returned by a find unless a query opts in with .select('+passwordHash'),
    //so a handler that forgets to exclude it explicitly gets it excluded anyway
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CLIENT }
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

//-----------------------------------------------------\\
//                    RECORD HELPERS
//-----------------------------------------------------\\

//stored lowercase and trimmed so that a duplicate check cannot be defeated by
//casing or padding, Alice@Site.com and alice@site.com are the same account
const normaliseEmail = (email) => String(email).trim().toLowerCase();

const isValidRole = (role) => SELF_ASSIGNABLE_ROLES.includes(role);

//the only shape a user may take in a response, every handler that returns a
//user goes through here
//it copies the allowed fields out rather than deleting the hash from a copy,
//so a field added to a record later is private until it is named above
const toPublicUser = (user) => {
  if (!user) {
    return null;
  }

  return Object.fromEntries(PUBLIC_FIELDS.map((field) => [field, user[field]]));
};

//-----------------------------------------------------\\
//                     DATA ACCESS
//-----------------------------------------------------\\

//returns every stored user, callers treat the result as read only
const findAllUsers = async () => User.find();

//the lookup the duplicate check and the login flow both run through, the hash
//is excluded from the schema by default so login opts back into it explicitly
const findUserByEmail = async (email) =>
  User.findOne({ email: normaliseEmail(email) }).select('+passwordHash');

//the lookup a verified token runs through, the id comes from the token rather
//than from anything the caller typed
//an id that was never a valid object id (an old part 1 token, or one that was
//tampered with) is treated as unknown rather than thrown at the database,
//which would otherwise surface as an uncaught cast error
const findUserById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  return User.findById(id);
};

//inserts a new user and hands back the stored record, the caller supplies an
//already hashed password because the model never sees a plain one
//the unique index on email is the real guarantee against two concurrent
//registrations for one address both succeeding, this just turns the
//database's rejection into the same error shape the controller already
//expects from part 1
const createUser = async ({ fullName, email, passwordHash, role }) => {
  try {
    return await User.create({
      fullName: String(fullName).trim(),
      email: normaliseEmail(email),
      passwordHash,
      role
    });
  } catch (error) {
    if (error.code === 11000) {
      const conflict = new Error('email already registered');
      conflict.code = EMAIL_TAKEN;
      throw conflict;
    }

    throw error;
  }
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = {
  User,
  ROLES,
  SELF_ASSIGNABLE_ROLES,
  USER_FIELDS,
  SENSITIVE_FIELDS,
  PUBLIC_FIELDS,
  EMAIL_TAKEN,
  normaliseEmail,
  isValidRole,
  toPublicUser,
  findAllUsers,
  findUserByEmail,
  findUserById,
  createUser
};
