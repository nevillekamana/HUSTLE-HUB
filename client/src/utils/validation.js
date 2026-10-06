//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { GIG_CATEGORIES } from '@/utils/categories';
import { toCents } from '@/utils/money';

//-----------------------------------------------------\\
//                    RULES AND LIMITS
//-----------------------------------------------------\\

//a copy of the api's own rules (plan section 8.6), so a form catches a bad
//value before it is sent, the api still checks everything again and stays
//the real gate, these only save a round trip and explain the problem sooner
//the patterns are the api's exactly, anchored at both ends with no nested
//quantifiers, so a crafted value cannot make them hang
const NAME_PATTERN = /^\p{L}[\p{L}\p{M}' -]*$/u;
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const HAS_LETTER = /[a-zA-Z]/;
const HAS_DIGIT = /[0-9]/;
const ANGLE_BRACKET = /[<>]/;

const LIMITS = Object.freeze({
  nameMin: 2,
  nameMax: 100,
  emailMax: 254,
  passwordMin: 8,
  passwordMax: 128,
  titleMin: 3,
  titleMax: 100,
  descriptionMin: 10,
  descriptionMax: 2000,
  priceMinCents: 100,
  priceMaxCents: 10000000
});

//only these two can be chosen when signing up, admin accounts are made by
//the platform team and the api refuses the role here whatever is sent
const SELF_ASSIGNABLE_ROLES = ['client', 'freelancer'];

//-----------------------------------------------------\\
//                     FIELD CHECKS
//-----------------------------------------------------\\

//each check answers with the same wording the api uses, a short phrase that
//follows the field's name, or null when the value is fine
//name and email are judged trimmed, as the api judges them
const checkFullName = (value) => {
  const trimmed = String(value || '').trim();

  if (trimmed === '') {
    return 'is required';
  }

  if (trimmed.length < LIMITS.nameMin || trimmed.length > LIMITS.nameMax) {
    return 'must be between ' + LIMITS.nameMin + ' and ' + LIMITS.nameMax + ' characters';
  }

  if (!NAME_PATTERN.test(trimmed)) {
    return 'may only contain letters, spaces, hyphens and apostrophes';
  }

  return null;
};

const checkEmail = (value) => {
  const trimmed = String(value || '').trim();

  if (trimmed === '') {
    return 'is required';
  }

  if (trimmed.length > LIMITS.emailMax) {
    return 'must be at most ' + LIMITS.emailMax + ' characters';
  }

  if (!EMAIL_PATTERN.test(trimmed)) {
    return 'must be a valid email address';
  }

  return null;
};

//never trimmed, a space is a real password character
const checkPassword = (value) => {
  if (typeof value !== 'string' || value === '') {
    return 'is required';
  }

  if (value.length < LIMITS.passwordMin || value.length > LIMITS.passwordMax) {
    return 'must be between ' + LIMITS.passwordMin + ' and ' + LIMITS.passwordMax + ' characters';
  }

  if (!HAS_LETTER.test(value) || !HAS_DIGIT.test(value)) {
    return 'must contain at least one letter and one number';
  }

  return null;
};

const checkRole = (value) =>
  SELF_ASSIGNABLE_ROLES.includes(value) ? null : 'must be one of ' + SELF_ASSIGNABLE_ROLES.join(' or ');

//gig text is measured trimmed, as the api measures it, and refused outright
//when it holds an angle bracket, the api's rule against markup in listings
const checkGigText = (min, max) => (value) => {
  const trimmed = String(value || '').trim();

  if (trimmed === '') {
    return 'is required';
  }

  if (trimmed.length < min || trimmed.length > max) {
    return 'must be between ' + min + ' and ' + max + ' characters';
  }

  return ANGLE_BRACKET.test(trimmed) ? 'must not contain < or >' : null;
};

const checkGigCategory = (value) => {
  if (value === undefined || value === null || value === '') {
    return 'is required';
  }

  return GIG_CATEGORIES.includes(value) ? null : 'must be one of ' + GIG_CATEGORIES.join(', ');
};

//typed in rands with at most two decimals, R 1 to R 100 000 is the api's
//priceCents range of 100 to 10 000 000
const checkGigPrice = (value) => {
  const text = String(value || '').trim();

  if (text === '') {
    return 'is required';
  }

  const cents = toCents(text);

  if (cents === null) {
    return 'must be an amount in rands, like 150 or 99.50';
  }

  if (cents < LIMITS.priceMinCents || cents > LIMITS.priceMaxCents) {
    return 'must be between R 1 and R 100 000';
  }

  return null;
};

//sign in only asks that both fields are filled, like the api, a format rule
//here would treat a malformed address differently from a wrong one and hint
//at which addresses hold accounts
const checkPresent = (value) => (String(value || '').trim() === '' ? 'is required' : null);

//-----------------------------------------------------\\
//                     FORM CHECKS
//-----------------------------------------------------\\

//every field is checked in one pass, so a person sees everything wrong at
//once, the result maps a field name to its phrase and is empty when valid
const collect = (checks, values) =>
  Object.entries(checks).reduce((errors, [field, check]) => {
    const problem = check(values[field]);
    return problem ? { ...errors, [field]: problem } : errors;
  }, {});

const REGISTER_CHECKS = {
  fullName: checkFullName,
  email: checkEmail,
  password: checkPassword,
  role: checkRole
};

const LOGIN_CHECKS = {
  email: checkPresent,
  password: checkPresent
};

//the price is checked as typed, in rands, the form converts it to cents
//only once everything passes
const GIG_CHECKS = {
  title: checkGigText(LIMITS.titleMin, LIMITS.titleMax),
  description: checkGigText(LIMITS.descriptionMin, LIMITS.descriptionMax),
  category: checkGigCategory,
  price: checkGigPrice
};

const validateRegister = (values) => collect(REGISTER_CHECKS, values);
const validateLogin = (values) => collect(LOGIN_CHECKS, values);
const validateGig = (values) => collect(GIG_CHECKS, values);

//-----------------------------------------------------\\
//                   SERVER FIELD ERRORS
//-----------------------------------------------------\\

//turns the api's [{ field, message }] list into the same field to phrase map
//the forms use, only the fields a form actually shows are kept, anything
//else is returned separately so the page can fall back to its banner
const mapFieldErrors = (fieldErrors, knownFields) =>
  (fieldErrors || []).reduce(
    (result, { field, message }) => {
      if (knownFields.includes(field) && !result.errors[field]) {
        result.errors[field] = message;
      } else if (!knownFields.includes(field)) {
        result.unmatched = true;
      }

      return result;
    },
    { errors: {}, unmatched: false }
  );

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export {
  LIMITS,
  SELF_ASSIGNABLE_ROLES,
  checkFullName,
  checkEmail,
  checkPassword,
  checkRole,
  validateRegister,
  validateLogin,
  validateGig,
  mapFieldErrors
};
