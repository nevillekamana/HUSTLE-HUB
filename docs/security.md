# Security

Role 2 (Security Specialist). All of this lives in `api/` and is tested by `npm run security:check`.

## What every request goes through

Requests pass these steps in this order (`api/app.js`). A request that fails a step is answered there and goes no further.

| # | Step | File | Refuses with |
| --- | --- | --- | --- |
| 1 | Security headers (Helmet + CSP) | `middleware/securityHeaders.js` | |
| 2 | Rate limit for the whole API | `middleware/rateLimitMiddleware.js` | 429 |
| 3 | Sanitisation (NoSQL injection, XSS) | `middleware/sanitizeMiddleware.js` | 400 |
| 4 | JWT check on every route that is not public | `middleware/apiGuard.js`, `middleware/requireAuth.js` | 401 |
| 5 | Route policy: role, id, rate limit, validation | `middleware/routeGuard.js`, `config/routePolicy.js` | 403, 400, 429 |
| 6 | The route itself, which adds the ownership check | `routes/` | 403, 404 |

## Roles and access (RBAC)

There are three roles: client, freelancer and admin. Permissions are named in `config/accessPolicy.js`, and `config/routePolicy.js` holds one row per protected address:

| Method | Address (after `/api`) | Who may call it | Also checked |
| --- | --- | --- | --- |
| GET | `/gigs` | client, freelancer, admin | list filters |
| GET | `/gigs/mine` | freelancer | |
| GET | `/gigs/:id` | client, freelancer, admin | id |
| POST | `/gigs` | freelancer | gig fields |
| PUT, PATCH | `/gigs/:id` | freelancer | id, gig fields |
| DELETE | `/gigs/:id` | freelancer, admin | id |
| POST | `/bookings` | client | booking rate limit, `gigId` |
| GET | `/bookings/mine` | client, freelancer | |
| GET | `/bookings/:id` | client, freelancer | id |
| GET | `/transactions/mine` | client, freelancer | |
| GET | `/income/me` | freelancer | |
| GET | `/transactions` | admin | `page`, `limit` |
| GET | `/admin/users` | admin | `page`, `limit` |
| any | `/admin/*` | admin | |

The table is enforced in one place for every request, so a route cannot be added without its role check. Matching ignores upper case and extra slashes, the same way Express does.

Ownership is the second half of RBAC: a freelancer may only change their own gigs, and a user only sees their own bookings and transactions. The route checks this against the database with `req.auth.id`. `authorizeOwner` in `middleware/roleMiddleware.js` is available for it.

## JWT

- Every `/api` route needs `Authorization: Bearer <token>` unless it is listed in `PUBLIC_ROUTES`: `GET /health`, `POST /auth/register` and `POST /auth/login`. A new route is protected the moment it is added.
- Only HS256 tokens signed with `JWT_SECRET` are accepted. Missing, expired, forged, unsigned (`alg: none`) and malformed tokens all get the same 401.
- The token must name a user id and one of the three roles. Only those two values are trusted (`req.auth.id`, `req.auth.role`).

## Input validation

`middleware/resourceValidation.js` uses the same limits as the React forms. A bad request gets 400 `validation failed` with one `{ field, message }` per problem.

| Input | Rule |
| --- | --- |
| `title` | text, 3 to 100 characters |
| `description` | text, 10 to 2000 characters |
| `category` | design, writing, development, marketing, tutoring or other |
| `priceCents` | whole number from 100 to 10000000 (R 1 to R 100 000) |
| `isActive` (update only) | true or false |
| `gigId` (booking) | 24 character hexadecimal id |
| `:id` in an address | 24 character hexadecimal id |
| `page`, `limit` | whole numbers, `limit` at most 100 |
| `category`, `q`, `minPrice`, `maxPrice` | checked, each allowed once, `q` at most 100 characters |

A field that is not in this table is refused, so a caller cannot send the owner of a gig or the price of a booking.

## Sanitisation

`middleware/sanitizeMiddleware.js` runs on every body and query string before any route.

- **NoSQL injection:** a key that starts with `$`, contains `.`, or is `__proto__`, `constructor` or `prototype` is refused with 400. So is JSON nested more than 8 levels deep.
- **XSS:** HTML tags are removed from all text, the content of `script` and `style` tags is dropped, a stray `<` or `>` is escaped and control characters are removed.
- Passwords are left exactly as typed, because they are hashed and never displayed.

The NoSQL rules are written by hand because `express-mongo-sanitize` does not support Express 5.

## Rate limiting

| Limit | Default | Counted per |
| --- | --- | --- |
| All API requests | 300 per minute | IP address |
| Failed logins | 5 per minute | IP address |
| Registrations | 30 per 15 minutes | IP address |
| Bookings | 10 per minute | signed in user |

A blocked request gets status 429, a `Retry-After` header and a body like this:

~~~json
{
  "success": false,
  "message": "too many login attempts, please try again shortly",
  "errors": [
    { "field": "rateLimit", "message": "limit of 5 requests per 1 minute reached, try again in 42 seconds" }
  ]
}
~~~

Each limit can be changed in `.env`, for example `RATE_LIMIT_LOGIN_MAX` (see `.env.example`).

## Security headers

Helmet is configured in `middleware/securityHeaders.js` with a strict Content Security Policy from `config/security.js`. The API only returns JSON, so nothing may be loaded, framed or submitted from its responses:

~~~text
default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; sandbox
~~~

Also sent: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Cross-Origin-Resource-Policy: same-site`, `Cross-Origin-Opener-Policy: same-origin`, `Permissions-Policy` (camera, microphone, geolocation, payment and usb switched off), `Cache-Control: no-store`, and `Strict-Transport-Security` in production. `X-Powered-By` is removed.

## Checking it

~~~powershell
cd api
npm run security:check
~~~

This starts the API on a spare port, sends real requests at every control above and prints PASS or FAIL for 68 checks. Nothing is saved.

## Adding a route

1. Add a row to `config/routePolicy.js` with the method, address, roles and checks.
2. Write the route. Use `req.auth.id` for the ownership check, `req.body` (already validated) and, on list routes, `req.paging` and `req.filters`.
3. Run `npm run security:check`.
