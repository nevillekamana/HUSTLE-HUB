//-----------------------------------------------------\\
//                SEAM — ROLE 1 REPLACES THIS
//-----------------------------------------------------\\
//answers the part 2 routes inside the browser until the real api serves them
//it follows the plan's contract (section 4) and rules (section 6.3) on purpose,
//same envelope, messages, status codes, ownership 404s and rate limits, so a
//page built against it behaves the same once the flag is switched off
//it is only ever loaded when VITE_API_MOCKS is set, see endpoints.js

//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { GIG_CATEGORIES } from '@/utils/categories';
import { DEMO_PASSWORD, buildSeed } from './seed';

//-----------------------------------------------------\\
//                   SETTINGS AND LIMITS
//-----------------------------------------------------\\

//long enough that loading states are visible while building the pages
const DELAY_MS = 350;
const STORE_KEY = 'hustlehub.mockdb';
const ROLES = { client: 'client', freelancer: 'freelancer', admin: 'admin' };
const SELF_ASSIGNABLE_ROLES = [ROLES.client, ROLES.freelancer];

//the same numbers as the api's validators and rate limiters
const LIMITS = Object.freeze({
  titleMin: 3,
  titleMax: 100,
  descriptionMin: 10,
  descriptionMax: 2000,
  priceMin: 100,
  priceMax: 10000000,
  queryMax: 50,
  pageLimitMax: 50,
  loginMax: 5,
  loginWindowMs: 60 * 1000,
  bookingMax: 10,
  bookingWindowMs: 15 * 60 * 1000
});

const NAME_PATTERN = /^\p{L}[\p{L}\p{M}' -]*$/u;
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const OBJECT_ID = /^[a-f0-9]{24}$/i;
const REFERENCE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

//-----------------------------------------------------\\
//                     REPLY HELPERS
//-----------------------------------------------------\\

const ok = (status, message, data = {}) => ({ status, envelope: { success: true, message, data } });
const fail = (status, message, errors = []) => ({ status, envelope: { success: false, message, errors } });
const invalid = (errors) => fail(400, 'validation failed', errors);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

//-----------------------------------------------------\\
//                   STORE AND IDENTITY
//-----------------------------------------------------\\

let db = null;
const recentFailedLogins = [];
const recentBookings = new Map();

//a demo password is never kept as text, even in a mock, a salted digest is
//enough to compare against and shows the habit the real api follows
const digest = async (email, password) => {
  const bytes = new TextEncoder().encode(email.toLowerCase() + ':' + password);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
};

const newId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');

const newReference = () =>
  'SIM-' + Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => REFERENCE_ALPHABET[b % 32]).join('');

const save = () => {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(db));
  } catch {
    //storage can be full or blocked, the mock then simply forgets on reload
  }
};

//kept for the tab's lifetime so a booking made before a refresh is still
//there after it, closing the tab starts from the seed again
const loadStore = async () => {
  if (db) {
    return db;
  }

  try {
    const stored = JSON.parse(sessionStorage.getItem(STORE_KEY));
    if (stored && Array.isArray(stored.users) && Array.isArray(stored.gigs)) {
      db = stored;
      return db;
    }
  } catch {
    //unreadable storage falls through to a fresh seed
  }

  db = buildSeed();
  await Promise.all(db.users.map(async (user) => {
    user.passwordDigest = await digest(user.email, DEMO_PASSWORD);
  }));
  save();
  return db;
};

const findUser = (id) => db.users.find((user) => user.id === id) || null;
const findGig = (id) => db.gigs.find((gig) => gig.id === id) || null;

//a mock token names a demo account, a real token from the part 1 api is a jwt
//whose payload the mock reads without verifying, the real api already
//checked the password when it issued it
const readIdentity = (token) => {
  if (!token) {
    return null;
  }

  if (token.startsWith('mock.')) {
    const user = findUser(token.slice(5));
    return user ? { id: user.id, role: user.role } : null;
  }

  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(part));
    return typeof payload.id === 'string' && typeof payload.role === 'string'
      ? { id: payload.id, role: payload.role }
      : null;
  } catch {
    return null;
  }
};

//called by endpoints.js after a real sign in, so gigs and bookings made in the
//mock can show the real account's name
const rememberUser = async (user) => {
  await loadStore();

  if (!user || typeof user.id !== 'string' || findUser(user.id)) {
    return;
  }

  db.users.push({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt || new Date().toISOString()
  });
  save();
};

//-----------------------------------------------------\\
//                   PUBLIC SERIALISERS
//-----------------------------------------------------\\

//allowlists in the style of toPublicUser, nothing stored leaves by accident
const publicUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt
});

const person = (id) => {
  const user = findUser(id);
  return { id, fullName: user ? user.fullName : 'Former member' };
};

const publicGig = (gig) => ({
  id: gig.id,
  title: gig.title,
  description: gig.description,
  category: gig.category,
  priceCents: gig.priceCents,
  isActive: gig.isActive,
  freelancer: person(gig.freelancer),
  createdAt: gig.createdAt,
  updatedAt: gig.updatedAt
});

const gigSummary = (id, fallbackTitle) => {
  const gig = findGig(id);
  return { id, title: gig ? gig.title : fallbackTitle, category: gig ? gig.category : 'other' };
};

//the create reply carries plain ids, list replies populate the names
const publicBooking = (booking, populate) => ({
  id: booking.id,
  gig: populate ? gigSummary(booking.gig, booking.gigTitle) : booking.gig,
  client: populate ? person(booking.client) : booking.client,
  freelancer: populate ? person(booking.freelancer) : booking.freelancer,
  priceCents: booking.priceCents,
  gigTitle: booking.gigTitle,
  status: booking.status,
  createdAt: booking.createdAt
});

const publicTransaction = (transaction, populate) => {
  const booking = db.bookings.find((item) => item.id === transaction.booking);
  return {
    id: transaction.id,
    booking: transaction.booking,
    gig: populate ? gigSummary(transaction.gig, booking ? booking.gigTitle : 'Removed gig') : transaction.gig,
    client: populate ? person(transaction.client) : transaction.client,
    freelancer: populate ? person(transaction.freelancer) : transaction.freelancer,
    amountCents: transaction.amountCents,
    currency: transaction.currency,
    status: transaction.status,
    reference: transaction.reference,
    createdAt: transaction.createdAt
  };
};

const newestFirst = (a, b) => (a.createdAt < b.createdAt ? 1 : -1);

//-----------------------------------------------------\\
//                  GUARDS AND VALIDATORS
//-----------------------------------------------------\\

//identity before permission, the same order as requireAuth then authorizeRoles
const guard = (auth, roles) => {
  if (!auth || !findUser(auth.id)) {
    return fail(401, 'authentication is required');
  }

  if (roles && !roles.includes(auth.role)) {
    return fail(403, 'you do not have permission to access this resource');
  }

  return null;
};

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

//mirrors the sanitize middleware, a key that could steer a mongo query is
//refused outright rather than stripped
const hasDisallowedKey = (value) => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return Object.entries(value).some(
    ([key, inner]) => key.startsWith('$') || key.includes('.') || hasDisallowedKey(inner)
  );
};

const checkText = (value, min, max) => {
  if (typeof value !== 'string' || value.trim() === '') {
    return 'is required';
  }

  if (value.trim().length < min || value.trim().length > max) {
    return 'must be between ' + min + ' and ' + max + ' characters';
  }

  return /[<>]/.test(value) ? 'must not contain < or >' : null;
};

const checkCategory = (value) =>
  GIG_CATEGORIES.includes(value) ? null : 'must be one of ' + GIG_CATEGORIES.join(', ');

const checkPrice = (value) =>
  Number.isInteger(value) && value >= LIMITS.priceMin && value <= LIMITS.priceMax
    ? null
    : 'must be a whole number of cents between ' + LIMITS.priceMin + ' and ' + LIMITS.priceMax;

const GIG_CHECKS = {
  title: (value) => checkText(value, LIMITS.titleMin, LIMITS.titleMax),
  description: (value) => checkText(value, LIMITS.descriptionMin, LIMITS.descriptionMax),
  category: (value) => (typeof value === 'string' && /[<>]/.test(value) ? 'must not contain < or >' : checkCategory(value)),
  priceCents: checkPrice,
  isActive: (value) => (typeof value === 'boolean' ? null : 'must be true or false')
};

//create needs every field, update needs at least one, both refuse unknown keys
//so a freelancer or an _id in the body can never reach the record
const validateGig = (body, partial) => {
  if (!isPlainObject(body)) {
    return [{ field: 'body', message: 'must be a json object' }];
  }

  const allowed = partial ? Object.keys(GIG_CHECKS) : ['title', 'description', 'category', 'priceCents'];
  const errors = Object.keys(body)
    .filter((key) => !allowed.includes(key))
    .map((key) => ({ field: key, message: 'is not allowed' }));

  const present = allowed.filter((key) => key in body);

  if (partial && present.length === 0) {
    errors.push({ field: 'body', message: 'must contain at least one field to update' });
  }

  for (const key of partial ? present : allowed) {
    const message = GIG_CHECKS[key](body[key]);
    if (message) {
      errors.push({ field: key, message });
    }
  }

  return errors;
};

//every query value must be one string, repeated keys arrive as arrays and
//are refused rather than guessed at
const readGigQuery = (search) => {
  const params = new URLSearchParams(search);
  const errors = [];
  const query = {};

  for (const key of new Set(params.keys())) {
    if (params.getAll(key).length > 1) {
      errors.push({ field: key, message: 'must be a single value' });
    } else {
      query[key] = params.get(key);
    }
  }

  const positive = (key, max) => {
    if (query[key] === undefined) {
      return;
    }

    if (!/^[1-9]\d*$/.test(query[key]) || (max && Number(query[key]) > max)) {
      errors.push({ field: key, message: max ? 'must be a whole number from 1 to ' + max : 'must be a whole number from 1' });
    }
  };

  const nonNegative = (key) => {
    if (query[key] !== undefined && !/^\d+$/.test(query[key])) {
      errors.push({ field: key, message: 'must be a whole number of cents' });
    }
  };

  positive('page');
  positive('limit', LIMITS.pageLimitMax);
  nonNegative('minPrice');
  nonNegative('maxPrice');

  if (query.q !== undefined && query.q.length > LIMITS.queryMax) {
    errors.push({ field: 'q', message: 'must be at most ' + LIMITS.queryMax + ' characters' });
  }

  if (query.category !== undefined && checkCategory(query.category)) {
    errors.push({ field: 'category', message: checkCategory(query.category) });
  }

  return { query, errors };
};

const readPage = (query, defaultLimit) => {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || defaultLimit, LIMITS.pageLimitMax);
  return { page, limit, skip: (page - 1) * limit };
};

//a sliding window, old entries fall out before counting
const withinLimit = (stamps, max, windowMs) => {
  const now = Date.now();

  while (stamps.length && now - stamps[0] > windowMs) {
    stamps.shift();
  }

  return stamps.length < max;
};

//-----------------------------------------------------\\
//                     AUTH HANDLERS
//-----------------------------------------------------\\

const register = async ({ body }) => {
  const fields = isPlainObject(body) ? body : {};
  const errors = [];
  const fullName = typeof fields.fullName === 'string' ? fields.fullName.trim() : '';
  const email = typeof fields.email === 'string' ? fields.email.trim() : '';

  if (!fullName) {
    errors.push({ field: 'fullName', message: 'is required' });
  } else if (fullName.length < 2 || fullName.length > 100) {
    errors.push({ field: 'fullName', message: 'must be between 2 and 100 characters' });
  } else if (!NAME_PATTERN.test(fullName)) {
    errors.push({ field: 'fullName', message: 'may only contain letters, spaces, hyphens and apostrophes' });
  }

  if (!email) {
    errors.push({ field: 'email', message: 'is required' });
  } else if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.push({ field: 'email', message: 'must be a valid email address' });
  }

  const password = fields.password;
  if (typeof password !== 'string' || password === '') {
    errors.push({ field: 'password', message: 'is required' });
  } else if (password.length < 8 || password.length > 128) {
    errors.push({ field: 'password', message: 'must be between 8 and 128 characters' });
  } else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    errors.push({ field: 'password', message: 'must contain at least one letter and one number' });
  }

  if (errors.length) {
    return invalid(errors);
  }

  const role = fields.role === undefined ? ROLES.client : fields.role;
  if (!SELF_ASSIGNABLE_ROLES.includes(role)) {
    return fail(400, 'the requested role is not valid', [
      { field: 'role', message: 'must be one of ' + SELF_ASSIGNABLE_ROLES.join(' or ') }
    ]);
  }

  if (db.users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    return fail(409, 'email already registered');
  }

  const user = {
    id: newId(),
    fullName,
    email: email.toLowerCase(),
    role,
    createdAt: new Date().toISOString(),
    passwordDigest: await digest(email, password)
  };

  db.users.push(user);
  save();
  return ok(201, 'user registered successfully', { user: publicUser(user) });
};

const login = async ({ body }) => {
  const fields = isPlainObject(body) ? body : {};
  const missing = ['email', 'password'].filter(
    (key) => typeof fields[key] !== 'string' || fields[key].trim() === ''
  );

  if (!withinLimit(recentFailedLogins, LIMITS.loginMax, LIMITS.loginWindowMs)) {
    return fail(429, 'too many login attempts, please try again shortly');
  }

  //the real limiter only skips successful requests, so a malformed attempt
  //counts against the window just like a wrong password
  if (missing.length) {
    recentFailedLogins.push(Date.now());
    return invalid(missing.map((field) => ({ field, message: 'is required' })));
  }

  const user = db.users.find((item) => item.email.toLowerCase() === fields.email.trim().toLowerCase());
  const matches = user && user.passwordDigest && user.passwordDigest === (await digest(user.email, fields.password));

  if (!matches) {
    recentFailedLogins.push(Date.now());
    return fail(401, 'invalid email or password');
  }

  return ok(200, 'login successful', { user: publicUser(user), token: 'mock.' + user.id });
};

const profile = ({ auth }) => guard(auth) || ok(200, 'profile retrieved', { user: publicUser(findUser(auth.id)) });

//-----------------------------------------------------\\
//                     GIG HANDLERS
//-----------------------------------------------------\\

const browseGigs = ({ auth, search }) => {
  const denied = guard(auth);
  if (denied) {
    return denied;
  }

  const { query, errors } = readGigQuery(search);
  if (errors.length) {
    return invalid(errors);
  }

  const words = (query.q || '').trim().toLowerCase();
  const matches = db.gigs
    .filter((gig) => gig.isActive && !gig.deletedAt)
    .filter((gig) => !query.category || gig.category === query.category)
    .filter((gig) => query.minPrice === undefined || gig.priceCents >= Number(query.minPrice))
    .filter((gig) => query.maxPrice === undefined || gig.priceCents <= Number(query.maxPrice))
    .filter((gig) => !words || (gig.title + ' ' + gig.description).toLowerCase().includes(words))
    .sort(newestFirst);

  const { page, limit, skip } = readPage(query, 12);
  return ok(200, 'gigs retrieved', {
    gigs: matches.slice(skip, skip + limit).map(publicGig),
    page,
    limit,
    total: matches.length
  });
};

const myGigs = ({ auth }) =>
  guard(auth, [ROLES.freelancer]) ||
  ok(200, 'gigs retrieved', {
    gigs: db.gigs
      .filter((gig) => gig.freelancer === auth.id && !gig.deletedAt)
      .sort(newestFirst)
      .map(publicGig)
  });

//an inactive gig is visible only to its owner and an admin, everyone else
//gets the same 404 as for a gig that never existed
const gigDetail = ({ auth, id }) => {
  const denied = guard(auth);
  if (denied) {
    return denied;
  }

  if (!OBJECT_ID.test(id)) {
    return fail(400, 'invalid id');
  }

  const gig = findGig(id);
  const canSeeHidden = gig && (gig.freelancer === auth.id || auth.role === ROLES.admin);

  if (!gig || ((!gig.isActive || gig.deletedAt) && !canSeeHidden)) {
    return fail(404, 'gig not found');
  }

  return ok(200, 'gig retrieved', { gig: publicGig(gig) });
};

//the owner comes from the token and never from the body
const createGig = ({ auth, body }) => {
  const denied = guard(auth, [ROLES.freelancer]);
  if (denied) {
    return denied;
  }

  const errors = validateGig(body, false);
  if (errors.length) {
    return invalid(errors);
  }

  const now = new Date().toISOString();
  const gig = {
    id: newId(),
    freelancer: auth.id,
    title: body.title.trim(),
    description: body.description.trim(),
    category: body.category,
    priceCents: body.priceCents,
    isActive: true,
    deletedAt: null,
    createdAt: now,
    updatedAt: now
  };

  db.gigs.push(gig);
  save();
  return ok(201, 'gig created', { gig: publicGig(gig) });
};

//ownership is part of the lookup, so someone else's gig reads as not found
const updateGig = ({ auth, id, body }) => {
  const denied = guard(auth, [ROLES.freelancer]);
  if (denied) {
    return denied;
  }

  if (!OBJECT_ID.test(id)) {
    return fail(400, 'invalid id');
  }

  const errors = validateGig(body, true);
  if (errors.length) {
    return invalid(errors);
  }

  const gig = db.gigs.find((item) => item.id === id && item.freelancer === auth.id && !item.deletedAt);
  if (!gig) {
    return fail(404, 'gig not found');
  }

  for (const key of Object.keys(GIG_CHECKS)) {
    if (key in body) {
      gig[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
    }
  }

  gig.updatedAt = new Date().toISOString();
  save();
  return ok(200, 'gig updated', { gig: publicGig(gig) });
};

//soft delete, bookings and payments still point at the gig afterwards
const deleteGig = ({ auth, id }) => {
  const denied = guard(auth, [ROLES.freelancer, ROLES.admin]);
  if (denied) {
    return denied;
  }

  if (!OBJECT_ID.test(id)) {
    return fail(400, 'invalid id');
  }

  const gig = db.gigs.find(
    (item) => item.id === id && !item.deletedAt && (auth.role === ROLES.admin || item.freelancer === auth.id)
  );

  if (!gig) {
    return fail(404, 'gig not found');
  }

  gig.isActive = false;
  gig.deletedAt = new Date().toISOString();
  gig.updatedAt = gig.deletedAt;
  save();
  return ok(200, 'gig deleted', { gig: publicGig(gig) });
};

//-----------------------------------------------------\\
//              BOOKING, PAYMENT AND INCOME
//-----------------------------------------------------\\

//price and freelancer come from the stored gig, the body may carry the gig
//id and nothing else, and the limiter counts every attempt per user
const createBooking = ({ auth, body }) => {
  const denied = guard(auth, [ROLES.client]);
  if (denied) {
    return denied;
  }

  const stamps = recentBookings.get(auth.id) || [];
  recentBookings.set(auth.id, stamps);

  if (!withinLimit(stamps, LIMITS.bookingMax, LIMITS.bookingWindowMs)) {
    return fail(429, 'too many bookings, please wait before booking again');
  }

  stamps.push(Date.now());

  if (!isPlainObject(body)) {
    return invalid([{ field: 'body', message: 'must be a json object' }]);
  }

  const errors = Object.keys(body)
    .filter((key) => key !== 'gigId')
    .map((key) => ({ field: key, message: 'is not allowed' }));

  if (typeof body.gigId !== 'string' || !OBJECT_ID.test(body.gigId)) {
    errors.push({ field: 'gigId', message: 'must be a valid id' });
  }

  if (errors.length) {
    return invalid(errors);
  }

  const gig = db.gigs.find((item) => item.id === body.gigId && item.isActive && !item.deletedAt);
  if (!gig) {
    return fail(404, 'gig not found');
  }

  if (gig.freelancer === auth.id) {
    return fail(409, 'you cannot book your own gig');
  }

  const createdAt = new Date().toISOString();
  const booking = {
    id: newId(),
    gig: gig.id,
    client: auth.id,
    freelancer: gig.freelancer,
    priceCents: gig.priceCents,
    gigTitle: gig.title,
    status: 'confirmed',
    createdAt
  };

  const transaction = {
    id: newId(),
    booking: booking.id,
    gig: gig.id,
    client: auth.id,
    freelancer: gig.freelancer,
    amountCents: gig.priceCents,
    currency: 'ZAR',
    status: 'completed',
    reference: newReference(),
    createdAt
  };

  db.bookings.push(booking);
  db.transactions.push(transaction);
  save();
  return ok(201, 'booking confirmed', {
    booking: publicBooking(booking, false),
    transaction: publicTransaction(transaction, false)
  });
};

const participantOf = (auth) => (record) => record.client === auth.id || record.freelancer === auth.id;

const myBookings = ({ auth }) => {
  const denied = guard(auth, [ROLES.client, ROLES.freelancer]);
  if (denied) {
    return denied;
  }

  const mine = db.bookings.filter((booking) =>
    auth.role === ROLES.client ? booking.client === auth.id : booking.freelancer === auth.id
  );

  return ok(200, 'bookings retrieved', {
    bookings: mine.sort(newestFirst).map((booking) => publicBooking(booking, true))
  });
};

const bookingDetail = ({ auth, id }) => {
  const denied = guard(auth);
  if (denied) {
    return denied;
  }

  if (!OBJECT_ID.test(id)) {
    return fail(400, 'invalid id');
  }

  const booking = db.bookings.find(
    (item) => item.id === id && (auth.role === ROLES.admin || participantOf(auth)(item))
  );

  return booking
    ? ok(200, 'booking retrieved', { booking: publicBooking(booking, true) })
    : fail(404, 'booking not found');
};

const myTransactions = ({ auth }) =>
  guard(auth, [ROLES.client, ROLES.freelancer]) ||
  ok(200, 'transactions retrieved', {
    transactions: db.transactions
      .filter(participantOf(auth))
      .sort(newestFirst)
      .map((transaction) => publicTransaction(transaction, true))
  });

const allTransactions = ({ auth, search }) => {
  const denied = guard(auth, [ROLES.admin]);
  if (denied) {
    return denied;
  }

  const { page, limit, skip } = readPage(Object.fromEntries(new URLSearchParams(search)), 20);
  const sorted = [...db.transactions].sort(newestFirst);
  return ok(200, 'transactions retrieved', {
    transactions: sorted.slice(skip, skip + limit).map((transaction) => publicTransaction(transaction, true)),
    page,
    limit,
    total: sorted.length
  });
};

//completed payments only, grouped the way the api's aggregation groups them
//and a freelancer with nothing yet gets zeros rather than a 404
const myIncome = ({ auth }) => {
  const denied = guard(auth, [ROLES.freelancer]);
  if (denied) {
    return denied;
  }

  const paid = db.transactions.filter((item) => item.freelancer === auth.id && item.status === 'completed');
  const group = (keyOf) => {
    const groups = new Map();
    for (const item of paid) {
      const key = keyOf(item);
      const entry = groups.get(key) || { totalCents: 0, count: 0 };
      entry.totalCents += item.amountCents;
      entry.count += 1;
      groups.set(key, entry);
    }
    return groups;
  };

  const byGig = [...group((item) => item.gig)].map(([gigId, entry]) => ({
    gigId,
    title: gigSummary(gigId, 'Removed gig').title,
    ...entry
  }));

  const byMonth = [...group((item) => item.createdAt.slice(0, 7))]
    .map(([month, entry]) => ({ month, ...entry }))
    .sort((a, b) => (a.month < b.month ? -1 : 1));

  return ok(200, 'income retrieved', {
    income: {
      currency: 'ZAR',
      totalCents: paid.reduce((sum, item) => sum + item.amountCents, 0),
      transactionCount: paid.length,
      byGig: byGig.sort((a, b) => b.totalCents - a.totalCents),
      byMonth
    }
  });
};

const listUsers = ({ auth, search }) => {
  const denied = guard(auth, [ROLES.admin]);
  if (denied) {
    return denied;
  }

  const { page, limit, skip } = readPage(Object.fromEntries(new URLSearchParams(search)), 20);
  const sorted = [...db.users].sort(newestFirst);
  return ok(200, 'users retrieved', {
    users: sorted.slice(skip, skip + limit).map(publicUser),
    page,
    limit,
    total: sorted.length
  });
};

//-----------------------------------------------------\\
//                    ROUTE TABLE
//-----------------------------------------------------\\

//declared in the same order as the api's routers, mine before :id
const ROUTES = [
  ['GET', /^\/health$/, () => ok(200, 'api is running', { status: 'ok' })],
  ['POST', /^\/auth\/register$/, register],
  ['POST', /^\/auth\/login$/, login],
  ['GET', /^\/auth\/profile$/, profile],
  ['GET', /^\/gigs$/, browseGigs],
  ['GET', /^\/gigs\/mine$/, myGigs],
  ['GET', /^\/gigs\/([^/]+)$/, gigDetail],
  ['POST', /^\/gigs$/, createGig],
  ['PUT', /^\/gigs\/([^/]+)$/, updateGig],
  ['DELETE', /^\/gigs\/([^/]+)$/, deleteGig],
  ['POST', /^\/bookings$/, createBooking],
  ['GET', /^\/bookings\/mine$/, myBookings],
  ['GET', /^\/bookings\/([^/]+)$/, bookingDetail],
  ['GET', /^\/transactions\/mine$/, myTransactions],
  ['GET', /^\/transactions$/, allTransactions],
  ['GET', /^\/income\/me$/, myIncome],
  ['GET', /^\/admin\/users$/, listUsers]
];

//-----------------------------------------------------\\
//                    MOCK TRANSPORT
//-----------------------------------------------------\\

//plugs into request() in place of fetch and answers with the same
//{ status, envelope } shape, so the error mapping cannot tell the difference
const mockTransport = async ({ method, path, body, token }) => {
  await loadStore();
  await wait(DELAY_MS);

  const [pathname, search = ''] = path.split('?');
  const auth = readIdentity(token);

  if (hasDisallowedKey(body) || [...new URLSearchParams(search).keys()].some((key) => key.startsWith('$'))) {
    return fail(400, 'request contains disallowed characters');
  }

  for (const [routeMethod, pattern, handler] of ROUTES) {
    const match = pathname.match(pattern);

    if (routeMethod === method && match) {
      try {
        return await handler({ auth, body, search, id: match[1] ? decodeURIComponent(match[1]) : undefined });
      } catch {
        return fail(500, 'an unexpected error occurred');
      }
    }
  }

  return fail(404, 'the requested route does not exist');
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { mockTransport, rememberUser };
