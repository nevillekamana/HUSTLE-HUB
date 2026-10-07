//------------------------------------------------\\
//              INPUT SANITISATION
//------------------------------------------------\\

const xss = require('xss');
const httpStatus = require('../utils/httpStatus');
const { sendFailure } = require('../utils/apiResponse');
const { SANITISER } = require('../config/security');

//------------------------------------------------\\
//            NOSQL INJECTION CHECKS
//------------------------------------------------\\

//mongodb treats a key that starts with $ as an operator and a dot as a
//path into a document, so {"email": {"$gt": ""}} would match every user.
//these are the same rules as express-mongo-sanitize, written here
//because that package assigns req.query, which is read only in express 5

const OPERATOR_PREFIX = '$';
const PATH_SEPARATOR = '.';

//keys that would reach the prototype of an object instead of its data
const PROTOTYPE_KEYS = Object.freeze(['__proto__', 'constructor', 'prototype']);

const isPlainObject = (value) =>
  Object.prototype.toString.call(value) === '[object Object]';

const describeKey = (key) => {
  if (PROTOTYPE_KEYS.includes(key)) {
    return 'is not an allowed key';
  }
  if (key.startsWith(OPERATOR_PREFIX) || key.includes(PATH_SEPARATOR)) {
    return 'keys may not start with $ or contain a dot';
  }
  return null;
};

//walks the value and returns the first problem found, or null
const findProblem = (value, path, depth) => {
  if (depth > SANITISER.maxDepth) {
    return { field: path, message: 'is nested too deeply' };
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const problem = findProblem(value[index], path + '[' + index + ']', depth + 1);
      if (problem) {
        return problem;
      }
    }
    return null;
  }
  if (!isPlainObject(value)) {
    return null;
  }
  for (const key of Object.keys(value)) {
    const field = path === '' ? key : path + '.' + key;
    const message = describeKey(key);
    if (message) {
      return { field, message };
    }
    const problem = findProblem(value[key], field, depth + 1);
    if (problem) {
      return problem;
    }
  }
  return null;
};

//------------------------------------------------\\
//               XSS CLEANING
//------------------------------------------------\\

//no html is allowed in any field: tags are removed, the content of
//script and style tags is dropped, and a stray < or > is escaped
const XSS_OPTIONS = Object.freeze({
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style']
});

//characters that are never typed, such as the null byte
const CONTROL_CHARACTERS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

const cleanText = (value) => xss(value.replace(CONTROL_CHARACTERS, ''), XSS_OPTIONS);

const cleanValue = (value, key) => {
  if (typeof value === 'string') {
    return SANITISER.untouchedFields.includes(key) ? value : cleanText(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => cleanValue(item, key));
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, child]) => [childKey, cleanValue(child, childKey)])
    );
  }
  return value;
};

//------------------------------------------------\\
//                 MIDDLEWARE
//------------------------------------------------\\

//runs after the json parser and before every route. a request that
//carries an operator is refused outright instead of being repaired,
//because nothing honest ever sends one
const sanitizeRequest = (req, res, next) => {
  const sources = [
    ['body', req.body],
    ['query', req.query]
  ];
  for (const [location, value] of sources) {
    const problem = findProblem(value, '', 0);
    if (problem) {
      console.warn('[security] blocked ' + req.method + ' ' + req.path + ': prohibited key in ' + location);
      return sendFailure(res, httpStatus.BAD_REQUEST, 'the request contains prohibited characters', [
        problem
      ]);
    }
  }
  if (req.body !== undefined) {
    req.body = cleanValue(req.body);
  }
  //express 5 builds req.query again on every read, so the cleaned copy
  //is pinned onto the request instead of being assigned
  Object.defineProperty(req, 'query', {
    value: cleanValue(req.query),
    writable: true,
    configurable: true,
    enumerable: true
  });
  return next();
};

//------------------------------------------------\\
//                    EXPORTS
//------------------------------------------------\\

module.exports = {
  sanitizeRequest,
  cleanText,
  findProblem
};
