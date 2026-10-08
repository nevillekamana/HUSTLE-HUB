//-----------------------------------------------------\\
//                SEED THE ADMIN ACCOUNT
//-----------------------------------------------------\\
//run with: npm run seed:admin
//registration refuses the admin role whatever a caller asks for, so this is
//the only way an admin account can exist, provisioned by whoever is running
//the api rather than self assigned through the public endpoint

//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const env = require('../config/env');
const { connectDatabase, disconnectDatabase } = require('../config/db');
const { User, ROLES, normaliseEmail } = require('../models/userModel');
const { hashPassword } = require('../services/passwordService');

//-----------------------------------------------------\\
//                      VALIDATION
//-----------------------------------------------------\\

//the same rule register and login enforce on a password, see
//middleware/validationMiddleware.js, duplicated rather than imported
//because that file exports express middleware, not a bare check
const checkPassword = (value) => {
  if (typeof value !== 'string' || value.length < 8 || value.length > 128) {
    return 'must be between 8 and 128 characters';
  }

  return /[a-zA-Z]/.test(value) && /[0-9]/.test(value) ? null : 'must contain at least one letter and one digit';
};

//-----------------------------------------------------\\
//                         SEED
//-----------------------------------------------------\\

const seed = async () => {
  if (!env.adminEmail || !env.adminPassword || !env.adminFullName) {
    console.error('[seed:admin] ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_FULL_NAME must all be set');
    process.exitCode = 1;
    return;
  }

  const passwordProblem = checkPassword(env.adminPassword);

  if (passwordProblem) {
    console.error('[seed:admin] ADMIN_PASSWORD ' + passwordProblem);
    process.exitCode = 1;
    return;
  }

  await connectDatabase();

  const email = normaliseEmail(env.adminEmail);
  const passwordHash = await hashPassword(env.adminPassword);

  //upserted by email rather than inserted, so running this twice updates the
  //one admin account instead of failing on the unique index or creating a
  //second one
  await User.updateOne(
    { email },
    { $set: { fullName: env.adminFullName, email, passwordHash, role: ROLES.ADMIN } },
    { upsert: true }
  );

  //the password is never logged, only confirmation that the account exists
  console.log('[seed:admin] admin account ready: ' + email);

  await disconnectDatabase();
};

seed().catch((error) => {
  console.error('[seed:admin] failed: ' + (error.name || 'Error'));
  process.exitCode = 1;
});
