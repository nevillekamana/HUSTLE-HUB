//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { request } from '@/api/client';

//-----------------------------------------------------\\
//                      MOCK FLAG
//-----------------------------------------------------\\

//VITE_API_MOCKS decides who answers, and is off unless it is set on purpose
//  off     every route goes to the real api (the default)
//  part2   auth and health go to the real part 1 api, the part 2 routes role 1
//          has not built yet are answered by the in browser mock server
//  all     everything is mocked, demo accounts included, for design review
//          and for pages such as admin that need an account part 1 cannot make
const MOCK_MODES = ['off', 'part2', 'all'];
const MOCK_MODE = MOCK_MODES.includes(import.meta.env.VITE_API_MOCKS) ? import.meta.env.VITE_API_MOCKS : 'off';

//loaded on demand, so a build with the flag off never downloads the mock
const loadMock = () => import('./mock/server.js');

//part2 marks a route from the part 2 contract that the mock can stand in for
const call = async (method, path, { body, part2 = false } = {}) => {
  if (MOCK_MODE === 'all' || (MOCK_MODE === 'part2' && part2)) {
    const { mockTransport } = await loadMock();
    return request(method, path, { body, transport: mockTransport });
  }

  return request(method, path, { body });
};

//after a real sign in the mock learns the account's name, so gigs and
//bookings it creates can show who made them
const rememberForMock = async (data) => {
  if (MOCK_MODE === 'part2' && data && data.user) {
    const { rememberUser } = await loadMock();
    await rememberUser(data.user);
  }

  return data;
};

//-----------------------------------------------------\\
//                       HELPERS
//-----------------------------------------------------\\

//only the values actually set make it into the query string
const toQuery = (params) => {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }

  const text = search.toString();
  return text ? '?' + text : '';
};

const withId = (base, id) => base + '/' + encodeURIComponent(id);

//each body is rebuilt from named fields, so a stray property on a form's
//state object can never be sent to the api by accident
const pick = (source, keys) =>
  Object.fromEntries(keys.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]));

//-----------------------------------------------------\\
//                     AUTH ENDPOINTS
//-----------------------------------------------------\\

const getHealth = () => call('GET', '/health');

const register = async (fields) =>
  rememberForMock(await call('POST', '/auth/register', { body: pick(fields, ['fullName', 'email', 'password', 'role']) }));

const login = async (fields) =>
  rememberForMock(await call('POST', '/auth/login', { body: pick(fields, ['email', 'password']) }));

const getProfile = async () => rememberForMock(await call('GET', '/auth/profile'));

//-----------------------------------------------------\\
//                     GIG ENDPOINTS
//-----------------------------------------------------\\

//prices in the query are cents, the page converts what a person types in rands
const getGigs = (filters = {}) =>
  call('GET', '/gigs' + toQuery(pick(filters, ['category', 'q', 'minPrice', 'maxPrice', 'page', 'limit'])), {
    part2: true
  });

const getMyGigs = () => call('GET', '/gigs/mine', { part2: true });

const getGig = (id) => call('GET', withId('/gigs', id), { part2: true });

const createGig = (fields) =>
  call('POST', '/gigs', { body: pick(fields, ['title', 'description', 'category', 'priceCents']), part2: true });

const updateGig = (id, changes) =>
  call('PUT', withId('/gigs', id), {
    body: pick(changes, ['title', 'description', 'category', 'priceCents', 'isActive']),
    part2: true
  });

//a soft delete on the server, the gig's bookings and payments stay intact
const deleteGig = (id) => call('DELETE', withId('/gigs', id), { part2: true });

//-----------------------------------------------------\\
//              BOOKING AND PAYMENT ENDPOINTS
//-----------------------------------------------------\\

//only the gig id is sent, the price and freelancer come from the server's record
const createBooking = (gigId) => call('POST', '/bookings', { body: { gigId }, part2: true });

const getMyBookings = () => call('GET', '/bookings/mine', { part2: true });

const getBooking = (id) => call('GET', withId('/bookings', id), { part2: true });

const getMyTransactions = () => call('GET', '/transactions/mine', { part2: true });

//-----------------------------------------------------\\
//              INCOME AND ADMIN ENDPOINTS
//-----------------------------------------------------\\

const getMyIncome = () => call('GET', '/income/me', { part2: true });

const getAllTransactions = (paging = {}) =>
  call('GET', '/transactions' + toQuery(pick(paging, ['page', 'limit'])), { part2: true });

const getUsers = (paging = {}) =>
  call('GET', '/admin/users' + toQuery(pick(paging, ['page', 'limit'])), { part2: true });

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export {
  MOCK_MODE,
  getHealth,
  register,
  login,
  getProfile,
  getGigs,
  getMyGigs,
  getGig,
  createGig,
  updateGig,
  deleteGig,
  createBooking,
  getMyBookings,
  getBooking,
  getMyTransactions,
  getMyIncome,
  getAllTransactions,
  getUsers
};
