//------------------------------------------------\\
//      GIG, BOOKING AND LIST INPUT VALIDATION
//------------------------------------------------\\
//the rules match the forms in client/src/utils/validation.js, so a value
//the form accepts is a value the api accepts. every validator answers
//400 'validation failed' with one { field, message } per problem, the
//same shape as register and login. the sanitiser has already run, so
//text arrives here with html removed

const httpStatus = require('../utils/httpStatus');
const { sendFailure } = require('../utils/apiResponse');

const GIG_CATEGORIES = Object.freeze(['design', 'writing', 'development', 'marketing', 'tutoring', 'other']);

const GIG_LIMITS = Object.freeze({
  titleMin: 3,
  titleMax: 100,
  descriptionMin: 10,
  descriptionMax: 2000,
  priceMinCents: 100,
  priceMaxCents: 10000000,
  searchMax: 100,
  pageMax: 100000,
  pageSizeDefault: 20,
  pageSizeMax: 100
});

//a mongodb id: exactly 24 hexadecimal characters
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const WHOLE_NUMBER = /^[0-9]{1,9}$/;
//what the sanitiser turns a stray < or > into
const ESCAPED_BRACKET = /&lt;|&gt;/;

const isMissing = (value) => value === undefined || value === null || value === '';
const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = (res, errors) => sendFailure(res, httpStatus.BAD_REQUEST, 'validation failed', errors);

//------------------------------------------------\\
//                 FIELD RULES
//------------------------------------------------\\
//each rule returns a message when the value is wrong and null when it is fine

const checkText = (min, max) => (value) => {
  if (isMissing(value) || (typeof value === 'string' && value.trim() === '')) {
    return 'is required';
  }
  if (typeof value !== 'string') {
    return 'must be text';
  }
  if (value.trim().length < min || value.trim().length > max) {
    return 'must be between ' + min + ' and ' + max + ' characters';
  }
  return ESCAPED_BRACKET.test(value) ? 'must not contain < or >' : null;
};

const checkCategory = (value) => {
  if (isMissing(value)) {
    return 'is required';
  }
  return GIG_CATEGORIES.includes(value) ? null : 'must be one of ' + GIG_CATEGORIES.join(', ');
};

const checkPrice = (value) => {
  if (isMissing(value)) {
    return 'is required';
  }
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return 'must be a whole number of cents';
  }
  return value < GIG_LIMITS.priceMinCents || value > GIG_LIMITS.priceMaxCents
    ? 'must be between R 1 and R 100 000'
    : null;
};

const checkBoolean = (value) => (typeof value === 'boolean' ? null : 'must be true or false');

const checkId = (value) => {
  if (isMissing(value)) {
    return 'is required';
  }
  return typeof value === 'string' && OBJECT_ID.test(value) ? null : 'must be a valid id';
};

const GIG_RULES = {
  title: checkText(GIG_LIMITS.titleMin, GIG_LIMITS.titleMax),
  description: checkText(GIG_LIMITS.descriptionMin, GIG_LIMITS.descriptionMax),
  category: checkCategory,
  priceCents: checkPrice
};

//------------------------------------------------\\
//               REQUEST BODIES
//------------------------------------------------\\
//a field that is not in the rules is refused, so a caller cannot slip in
//values such as the owner of a gig or the price of a booking. with
//partial set, fields may be left out but at least one must be sent.
//on success req.body holds only the checked fields, with text trimmed

const validateBody = (rules, { partial = false } = {}) => (req, res, next) => {
  const body = req.body === undefined ? {} : req.body;
  if (!isPlainObject(body)) {
    return fail(res, [{ field: 'body', message: 'must be a json object' }]);
  }
  const fields = Object.keys(rules);
  const errors = Object.keys(body)
    .filter((field) => !fields.includes(field))
    .map((field) => ({ field, message: 'is not an accepted field' }));
  const checked = {};
  fields
    .filter((field) => !partial || body[field] !== undefined)
    .forEach((field) => {
      const message = rules[field](body[field]);
      if (message) {
        errors.push({ field, message });
      }
      checked[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
    });
  if (partial && errors.length === 0 && Object.keys(checked).length === 0) {
    errors.push({ field: 'body', message: 'must contain at least one of ' + fields.join(', ') });
  }
  if (errors.length > 0) {
    return fail(res, errors);
  }
  req.body = checked;
  return next();
};

const validateGigCreate = validateBody(GIG_RULES);
const validateGigUpdate = validateBody({ ...GIG_RULES, isActive: checkBoolean }, { partial: true });
const validateBookingCreate = validateBody({ gigId: checkId });

//for an id in the address, for example router.get('/:id', validateIdParam('id'), ...)
const validateIdParam = (name = 'id') => (req, res, next) => {
  const message = checkId(req.params[name]);
  return message ? fail(res, [{ field: name, message }]) : next();
};

//------------------------------------------------\\
//              QUERY STRINGS
//------------------------------------------------\\
//each reader returns { value } when the text is fine or { message } when not

const readWholeNumber = (min, max) => (text) => {
  const value = Number(text);
  return WHOLE_NUMBER.test(text) && value >= min && value <= max
    ? { value }
    : { message: 'must be a whole number between ' + min + ' and ' + max };
};

const readCategory = (text) =>
  GIG_CATEGORIES.includes(text) ? { value: text } : { message: 'must be one of ' + GIG_CATEGORIES.join(', ') };

const readSearch = (text) => {
  if (text.length > GIG_LIMITS.searchMax) {
    return { message: 'must be at most ' + GIG_LIMITS.searchMax + ' characters' };
  }
  return ESCAPED_BRACKET.test(text) ? { message: 'must not contain < or >' } : { value: text };
};

const PAGING_READERS = {
  page: readWholeNumber(1, GIG_LIMITS.pageMax),
  limit: readWholeNumber(1, GIG_LIMITS.pageSizeMax)
};

const GIG_QUERY_READERS = {
  ...PAGING_READERS,
  category: readCategory,
  q: readSearch,
  minPrice: readWholeNumber(0, GIG_LIMITS.priceMaxCents),
  maxPrice: readWholeNumber(0, GIG_LIMITS.priceMaxCents)
};

//on success the checked values are left on the request for the route:
//req.paging = { page, limit, skip } and req.filters = { category, q, ... }
//holding only the filters that were sent. an empty filter counts as not sent
const validateQuery = (readers) => (req, res, next) => {
  const query = req.query || {};
  const errors = [];
  const values = {};
  Object.keys(query).forEach((field) => {
    const text = query[field];
    if (!Object.keys(readers).includes(field)) {
      errors.push({ field, message: 'is not a supported option' });
    } else if (typeof text !== 'string') {
      errors.push({ field, message: 'must be given only once' });
    } else if (text.trim() !== '') {
      const result = readers[field](text.trim());
      if (result.message) {
        errors.push({ field, message: result.message });
      } else {
        values[field] = result.value;
      }
    }
  });
  if (values.minPrice > values.maxPrice) {
    errors.push({ field: 'minPrice', message: 'must not be more than maxPrice' });
  }
  if (errors.length > 0) {
    return fail(res, errors);
  }
  const { page = 1, limit = GIG_LIMITS.pageSizeDefault, ...filters } = values;
  req.paging = { page, limit, skip: (page - 1) * limit };
  req.filters = filters;
  return next();
};

const validateGigQuery = validateQuery(GIG_QUERY_READERS);
const validatePaging = validateQuery(PAGING_READERS);

//makes search text safe to use inside a database $regex, for example
//{ title: { $regex: escapeRegex(req.filters.q), $options: 'i' } }
const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

//------------------------------------------------\\
//                    EXPORTS
//------------------------------------------------\\

module.exports = {
  validateGigCreate,
  validateGigUpdate,
  validateBookingCreate,
  validateIdParam,
  validateGigQuery,
  validatePaging,
  escapeRegex,
  GIG_CATEGORIES,
  GIG_LIMITS
};
