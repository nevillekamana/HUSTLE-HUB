//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const { randomUUID } = require('crypto');

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

//-----------------------------------------------------\\
//                     FIELD HELPERS
//-----------------------------------------------------\\

//stored lowercase and trimmed so that a duplicate check cannot be defeated by
//casing or padding, Alice@Site.com and alice@site.com are the same account
const normaliseEmail = (email) => String(email).trim().toLowerCase();

const isValidRole = (role) => SELF_ASSIGNABLE_ROLES.includes(role);

//-----------------------------------------------------\\
//                  RECORD CONSTRUCTION
//-----------------------------------------------------\\

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
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = {
  USERS_FILE,
  ROLES,
  SELF_ASSIGNABLE_ROLES,
  USER_FIELDS,
  SENSITIVE_FIELDS,
  normaliseEmail,
  isValidRole,
  buildUser
};
