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

const LIMITS = Object.freeze({
  nameMin: 2,
  nameMax: 100,
  emailMax: 254,
  passwordMin: 8,
  passwordMax: 128
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

const validateRegister = (values) => collect(REGISTER_CHECKS, values);
const validateLogin = (values) => collect(LOGIN_CHECKS, values);

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
  mapFieldErrors
};
