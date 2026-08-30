//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const httpStatus = require('../utils/httpStatus');
const { sendFailure } = require('../utils/apiResponse');

//-----------------------------------------------------\\
//                    RULES AND LIMITS
//-----------------------------------------------------\\

//whitelists, they describe what a value may contain rather than listing what it
//may not, so a character nobody anticipated is refused by default
//both ends are anchored because an unanchored pattern matches a fragment and
//would accept any amount of junk wrapped around a valid looking substring
//neither pattern nests a quantifier inside another, which is what makes a
//regular expression hang on a crafted input rather than fail on it
const NAME_PATTERN = /^\p{L}[\p{L}\p{M}' -]*$/u;
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const HAS_LETTER = /[a-zA-Z]/;
const HAS_DIGIT = /[0-9]/;

//an upper bound is a security control rather than a formatting preference,
//hashing is deliberately slow so an unbounded password is a cheap way to spend
//someone else's processor time
const LIMITS = Object.freeze({
  nameMin: 2,
  nameMax: 100,
  emailMax: 254,
  passwordMin: 8,
  passwordMax: 128
});

//-----------------------------------------------------\\
//                     FIELD CHECKS
//-----------------------------------------------------\\

//a field that is absent, blank, or not a string all fail the same way, so a
//number or an object cannot slip past a truthiness check
const readTrimmed = (value) =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : null;

const checkFullName = (value) => {
  if (value === null) {
    return 'is required';
  }

  if (value.length < LIMITS.nameMin || value.length > LIMITS.nameMax) {
    return 'must be between ' + LIMITS.nameMin + ' and ' + LIMITS.nameMax + ' characters';
  }

  if (!NAME_PATTERN.test(value)) {
    return 'may only contain letters, spaces, hyphens and apostrophes';
  }

  return null;
};

const checkEmail = (value) => {
  if (value === null) {
    return 'is required';
  }

  if (value.length > LIMITS.emailMax) {
    return 'must be at most ' + LIMITS.emailMax + ' characters';
  }

  if (!EMAIL_PATTERN.test(value)) {
    return 'must be a valid email address';
  }

  return null;
};

//deliberately not trimmed, a space is a legitimate password character and
//quietly removing one would mean the password stored is not the one chosen
const checkPassword = (value) => {
  if (typeof value !== 'string' || value === '') {
    return 'is required';
  }

  if (value.length < LIMITS.passwordMin || value.length > LIMITS.passwordMax) {
    return (
      'must be between ' +
      LIMITS.passwordMin +
      ' and ' +
      LIMITS.passwordMax +
      ' characters'
    );
  }

  if (!HAS_LETTER.test(value) || !HAS_DIGIT.test(value)) {
    return 'must contain at least one letter and one number';
  }

  return null;
};

//the role is optional and the controller decides which values are assignable,
//so all that is checked here is that it is the right type to be judged
const checkRole = (value) => {
  if (value === undefined) {
    return null;
  }

  return typeof value === 'string' ? null : 'must be a string';
};

//-----------------------------------------------------\\
//                      VALIDATORS
//-----------------------------------------------------\\

//every field is checked before anything is reported, so a caller fixing a bad
//body learns everything wrong with it in one reply instead of one fault at a time
const validateRegister = (req, res, next) => {
  const body = req.body || {};
  const errors = [];
  const record = (field, message) => {
    if (message) {
      errors.push({ field, message });
    }
  };

  record('fullName', checkFullName(readTrimmed(body.fullName)));
  record('email', checkEmail(readTrimmed(body.email)));
  record('password', checkPassword(body.password));
  record('role', checkRole(body.role));

  if (errors.length > 0) {
    return sendFailure(res, httpStatus.BAD_REQUEST, 'validation failed', errors);
  }

  return next();
};

//login checks that the fields are present and nothing more
//a format rule here would answer a badly formed address with a 400 while every
//other failed attempt answers 401, and that difference tells an attacker which
//addresses are worth guessing at
//a strength rule here would be worse, it would lock an account out of its own
//login the moment the rule changed
const validateLogin = (req, res, next) => {
  const errors = ['email', 'password']
    .filter((field) => readTrimmed((req.body || {})[field]) === null)
    .map((field) => ({ field, message: 'is required' }));

  if (errors.length > 0) {
    return sendFailure(res, httpStatus.BAD_REQUEST, 'validation failed', errors);
  }

  return next();
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = {
  validateRegister,
  validateLogin
};
