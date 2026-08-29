//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const { randomUUID } = require('crypto');
const { readCollection, updateCollection } = require('../store/jsonStore');

//-----------------------------------------------------\\
//                        SCHEMA
//-----------------------------------------------------\\

//the collection file this model persists into
const USERS_FILE = 'users.json';

//the roles a user may hold, admin exists for part 2 but is never assignable
//through the public registration endpoint
const ROLES = {
  CLIENT: 'client',
  FREELANCER: 'freelancer',
  ADMIN: 'admin'
};

//only these two may be chosen by whoever is registering
const SELF_ASSIGNABLE_ROLES = [ROLES.CLIENT, ROLES.FREELANCER];

//the shape every stored user record takes, kept in one place so the model,
//the serialiser and role 2 all agree on the field names
const USER_FIELDS = [
  'id',
  'fullName',
  'email',
  'passwordHash',
  'role',
  'createdAt'
];

//never leaves the api, the serialiser strips these before any response
const SENSITIVE_FIELDS = ['passwordHash'];

//raised when the address is already registered, the register controller turns
//this into a conflict response so no storage detail reaches the client
const EMAIL_TAKEN = 'EMAIL_TAKEN';

//-----------------------------------------------------\\
//                    RECORD HELPERS
//-----------------------------------------------------\\

//stored lowercase and trimmed so that a duplicate check cannot be defeated by
//casing or padding, Alice@Site.com and alice@site.com are the same account
const normaliseEmail = (email) => String(email).trim().toLowerCase();

const isValidRole = (role) => SELF_ASSIGNABLE_ROLES.includes(role);

//builds the record in the canonical field order, the caller supplies an
//already hashed password because the model never sees a plain one
const buildUser = ({ fullName, email, passwordHash, role }) => ({
  id: randomUUID(),
  fullName: String(fullName).trim(),
  email: normaliseEmail(email),
  passwordHash,
  role,
  createdAt: new Date().toISOString()
});

//-----------------------------------------------------\\
//                     DATA ACCESS
//-----------------------------------------------------\\

//returns every stored user, callers treat the result as read only
const findAllUsers = async () => readCollection(USERS_FILE);

//the lookup the duplicate check and the login flow both run through, the
//needle is normalised so a differently cased address still finds the account
const findUserByEmail = async (email) => {
  const normalised = normaliseEmail(email);
  const users = await findAllUsers();
  return users.find((user) => user.email === normalised) || null;
};

//inserts a new user and hands back the stored record, the caller supplies an
//already hashed password because the model never sees a plain one
//the duplicate check runs inside the same lock as the insert, a check made
//before this call leaves a window where two requests for one address both
//pass it and both write a record
const createUser = async ({ fullName, email, passwordHash, role }) => {
  const user = buildUser({ fullName, email, passwordHash, role });

  await updateCollection(USERS_FILE, (users) => {
    if (users.some((record) => record.email === user.email)) {
      const conflict = new Error('email already registered');
      conflict.code = EMAIL_TAKEN;
      throw conflict;
    }

    return users.concat(user);
  });

  return user;
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = {
  USERS_FILE,
  ROLES,
  SELF_ASSIGNABLE_ROLES,
  USER_FIELDS,
  SENSITIVE_FIELDS,
  EMAIL_TAKEN,
  normaliseEmail,
  isValidRole,
  buildUser,
  findAllUsers,
  findUserByEmail,
  createUser
};
