//-----------------------------------------------------\\
//                    SEAM — ROLE 2 OWNS THIS
//-----------------------------------------------------\\
//role 1 defines the interface only, role 2 implements the internals

//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const bcrypt = require('bcryptjs');
const env = require('../config/env');

//-----------------------------------------------------\\
//                   PASSWORD HASHING
//-----------------------------------------------------\\

//bcryptjs is the pure javascript build, chosen so the project installs with no
//native build tools on any machine, the native bcrypt package exposes the same
//api so role 2 can swap the import without changing anything else here

//turns a plain password into a storable hash, a fresh salt is generated per
//call and kept inside the returned string, so nothing else needs storing
//the work factor comes from config, where it cannot be set below ten
const hashPassword = async (plainPassword) => bcrypt.hash(plainPassword, env.bcryptRounds);

//checks a candidate password against a stored hash, returns a boolean rather
//than throwing, because a wrong password is an expected outcome not an error
const verifyPassword = async (plainPassword, hash) => {
  //bcrypt would reject these anyway, refusing them here states the intent that
  //an absent hash is never a match
  if (!plainPassword || !hash) {
    return false;
  }

  return bcrypt.compare(plainPassword, hash);
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = {
  hashPassword,
  verifyPassword
};
