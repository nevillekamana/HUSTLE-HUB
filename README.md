# HustleHub+

A secure freelance marketplace platform that allows freelancers to advertise
services and clients to browse and book those services. The system records the
financial transactions generated through bookings and gives freelancers an
indication of income earned and estimated tax obligations.

---

## Table of Contents

- [Overview](#overview)
- [Intended Users](#intended-users)
- [System Architecture](#system-architecture)
- [Backend Structure](#backend-structure)
- [Authentication Flow](#authentication-flow)
- [Security Decisions](#security-decisions)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Demonstration](#demonstration)
- [Team](#team)

---

## Overview

HustleHub+ is a freelance marketplace platform: freelancers advertise services,
and clients browse and book them. Because the platform will go on to handle
account credentials, booking records, and income and tax data, Part 1 treats
security as a foundation rather than something bolted on afterward. The
backend built here is a small, self-contained authentication API that Parts 2
and 3 extend rather than rework.

## Intended Users

The platform is designed around three roles. Part 1 implements the first two;
`admin` is a reserved role that exists in the data model but cannot yet be
reached, since the marketplace features it will administer don't exist yet.

| Role | Description | Status in Part 1 |
|---|---|---|
| Client | Books gigs from freelancers. Default role on registration. | Can register and log in |
| Freelancer | Advertises gigs and tracks income from bookings. | Can register and log in |
| Admin | Platform oversight (Part 2+). | Reserved role; not self-assignable, no admin account can currently be created |

## System Architecture

![[system-architecture.png]]

The diagram reflects the MERN architecture as it stands at the end of Part 1: a
client sends a request over HTTPS into the Express backend, which passes it
through a request pipeline before domain logic touches storage. The "M" and
the "F" of MERN sit outside the current system boundary — MongoDB is not yet
wired in (a JSON file stands in for it) and the React frontend is Part 2.

**System boundary.** Everything inside the dashed outer box is the API
process; the client and the eventual MongoDB deployment sit outside it. The
only way in is through the request pipeline — there is no code path that
reaches the domain logic or the store without first passing validation and, on
protected routes, JWT verification. Any error thrown or rejected from any
layer is caught by one central handler that replies from a fixed message
table, never from the raw error, so nothing internal — no stack trace, file
path, or configuration value — ever leaves the boundary.

## Backend Structure

The backend is a Node.js and Express API with no database yet: users are held
in a JSON file behind a small datastore module, which keeps Part 1
self-contained while leaving one clear seam to swap in MongoDB later. Every
request follows the same path, and every response leaves through the same
pair of senders, so the API answers in one shape no matter which endpoint was
hit.

| Folder | Holds | Rule it follows |
|---|---|---|
| `config/` | `env.js` | The only file in the API that reads `process.env` |
| `routes/` | `index.js`, `authRoutes.js` | Declares paths, never logic |
| `controllers/` | `authController.js` | Handles a request, delegates the work |
| `models/` | `userModel.js` | Owns the shape of a user and how one is found or made |
| `store/` | `jsonStore.js` | Reads and writes the JSON files, with a lock |
| `services/` | `passwordService.js`, `tokenService.js` | Hashing and tokens |
| `middleware/` | `validationMiddleware.js`, `requireAuth.js`, `roleMiddleware.js`, `rateLimitMiddleware.js`, `notFound.js`, `errorHandler.js` | Runs before or after a handler |
| `utils/` | `apiResponse.js`, `httpStatus.js` | The response envelope and status codes |

`app.js` builds the application; `server.js` starts it. Keeping those apart
means the same app object can be wrapped in an HTTPS server without `app.js`
changing.

### Request lifecycle

```
request
  -> express.json({ limit: '10kb' })     body parsed, oversized bodies refused
  -> app.use('/api', routes)             the router index
       -> /health                        liveness probe
       -> /auth  -> authRoutes           register, login, profile, admin
            -> loginRateLimiter          login only, failed attempts capped
            -> validation                format and strength rules, 400 on failure
            -> requireAuth               protected routes only
            -> authorizeRoles            role restricted routes only
            -> controller                delegates and responds
  -> notFound                            nothing matched, 404
  -> errorHandler                        anything that threw, controlled reply
```

The order is load-bearing: `notFound` is mounted second-last and `errorHandler`
last, so a route registered below either of them would never run — consistent
with Express's own guidance that error-handling middleware must be defined
after other `app.use()` and route calls to be reached at all.

### Response envelope

Every response uses one of two shapes. Success bodies carry `data` and never
`errors`; failure bodies carry `errors` and never `data`.

```json
{ "success": true,  "message": "user registered successfully", "data": { } }
{ "success": false, "message": "email already registered",     "errors": [ ] }
```

Field-level validation detail goes in `errors`:

```json
{
  "success": false,
  "message": "validation failed",
  "errors": [
    { "field": "email", "message": "must be a valid email address" },
    { "field": "password", "message": "must be between 8 and 128 characters" }
  ]
}
```

## Authentication Flow

![[auth-flow-diagram.png]]

The diagram documents the registration and login flows exactly as implemented,
verified by exercising both endpoints against the running API, including the
invalid-input and duplicate-account cases.

### Registration flow — `POST /api/auth/register`

1. The client sends `fullName`, `email`, `password`, and an optional `role`, over HTTPS.
2. `express.json` parses the body (rejecting anything over 10kb before it is even buffered).
3. `validateRegister` checks every field before reporting anything, so one reply
   lists everything wrong with the request rather than one fault at a time:
   full name (2–100 characters, letters/spaces/hyphens/apostrophes only), email
   (valid format, ≤254 characters), password (8–128 characters, at least one
   letter and one digit), and role (if present, must be a string).
4. The controller resolves the requested role — `client` or `freelancer` only;
   `admin` is a real stored role but is not in the self-assignable list, so no
   request body can produce one.
5. The controller looks up the email first, so an obvious duplicate does not
   pay for a bcrypt run, and returns 409 Conflict if it is already registered.
6. The password is hashed with bcrypt (work factor from config, minimum 10);
   the plain password travels no further than the controller — only the hash
   is passed to the model.
7. The user model builds the record and writes it through the JSON store,
   whose duplicate check re-runs inside the same file lock as the insert,
   closing the race window between steps 5 and 7.
8. The response returns 201 Created with the safe user object (never the password hash).

### Login flow — `POST /api/auth/login`

1. The client sends `email` and `password`.
2. A per-client rate limiter allows 5 failed attempts per minute before
   replying 429 Too Many Requests; successful logins don't count against the
   limit, so a legitimate user is never locked out of their own account — the
   kind of automated-guessing control OWASP recommends against credential
   stuffing and brute-force attempts.
3. `validateLogin` checks only that both fields are present, deliberately
   looser than registration (see [Security Decisions](#security-decisions)).
4. The controller looks up the user by email and compares the supplied
   password against the stored hash with bcrypt. An unknown email and a wrong
   password return the same 401 Unauthorized with the same message, so a
   reply can't be used to discover which addresses are registered.
5. On a match, `tokenService.generateToken({ id, role })` issues a JWT signed
   with the server's secret, expiring after the configured lifetime (default 1 hour).
6. The response returns 200 OK with the safe user object and the token.
7. For subsequent requests, the client sends the token as `Authorization: Bearer <token>`.
8. `requireAuth` extracts and verifies the token on every protected route. A
   missing, malformed, expired, or forged token all produce the same 401
   Unauthorized — the middleware never reveals which case occurred. On
   success, the verified `id` and `role` are attached to `req.auth` for the
   handler behind it.
9. `authorizeRoles(...)` (used on `/api/auth/admin`) runs after `requireAuth`
   and checks `req.auth.role` against an allow-list, replying 403 Forbidden
   for a known but unpermitted caller.

## Security Decisions

Each decision below is a deliberate trade-off, not just a feature checklist —
the reasoning is what the code actually does, verified by inspection and by
running the API locally, and is weighed against the risk categories the OWASP
Top 10 identifies as most common in web applications, including cryptographic
failures and identification and authentication failures.

### Password hashing

Passwords are hashed with bcrypt (`bcryptjs`, the pure-JavaScript build, chosen
so the project installs without native build tools on any machine) at a work
factor of 12, and the config loader raises anything below 10 rather than
trusting it. bcrypt is a deliberately slow, adaptive hashing function
originally designed by Provos and Mazières specifically to resist brute-force
attacks as hardware speeds increase, and OWASP lists it as one of the
acceptable algorithms for password storage. Hashing rather than encryption is
used because it is one-way: there is no key that decrypts a hash back to the
original password, so a stolen hash cannot be reversed to recover the
credential, only guessed against.

Plain-text passwords are never retained: the user model's `buildUser()`
accepts `passwordHash` and has no parameter for a plain password at all, so
storing one by accident would require changing the model, not just a call
site. The `toPublicUser()` serialiser is an allowlist — it copies out the
fields named as public rather than deleting the sensitive ones — so a field
added to a user record later is private by default and has to be deliberately
named to become visible in a response. The password length ceiling (128
characters) is itself a security control: hashing is deliberately slow, so an
unbounded password would be a cheap way to spend the server's processor time,
consistent with NIST guidance that verifiers should accept passwords up to at
least 64 characters while still enforcing a sane upper bound to prevent
resource-exhaustion abuse.

### Token-based authentication (JWT)

A JWT is issued on successful login via `jsonwebtoken`, signed with a secret
read from `JWT_SECRET` and expiring after `JWT_EXPIRES_IN` (default `1h`),
following the structure and claim semantics defined in RFC 7519. The payload
is deliberately minimal — `{ id, role }` — because a JWT payload is
base64-encoded, not encrypted, so anyone holding the token can read it; no
email or name is included, in line with OWASP's guidance not to place
sensitive data in a JWT payload.

On every protected request, `requireAuth` extracts the bearer token from the
`Authorization` header and verifies it against the same secret; the verified
`id` and `role` (not anything the caller typed) are what the rest of the
request trusts. If `JWT_SECRET` is left unset, the API still boots — it
generates a throwaway secret for that process only and logs a warning — which
keeps a fresh clone runnable but means every token issued that way stops
verifying the moment the process restarts, which is the intended nudge to set
a real secret.

### Input validation

Validation is whitelist-based: patterns describe what a value may contain
rather than trying to enumerate what it may not, so a character nobody
anticipated is refused by default — the approach OWASP recommends as the
primary means of validating free-form text input. Every pattern is anchored at
both ends (`^...$`), because an unanchored pattern matches a fragment and
would accept junk wrapped around a valid-looking substring.

Registration validates full name, email format and length, and password
length/strength; login validates only that both fields are present. That
asymmetry is intentional: a format rule on login would answer a malformed
email with 400 while every other failed login answers 401, and that difference
would tell an attacker which addresses are worth guessing at — so login is
checked as loosely as correctness allows, and everything else is rejected
before it reaches business logic, consistent with OWASP's authentication
guidance that an application should not reveal which accounts exist through
its error responses.

### HTTPS

`server.js` looks for a PFX certificate bundle at the path configured by
`SSL_PFX_PATH` (default `api/certs/localhost.pfx`). If it's present, the app is
served with `https.createServer({ pfx, passphrase }, app)`; if it's absent,
the server falls back to plain HTTP and logs a visible warning ("no
certificate found, starting over http instead of https") rather than failing
silently.

Certificate and key material is excluded by `.gitignore`
(`*.pem`, `*.key`, `*.crt`, `*.pfx`, `*.p12`), so a fresh clone never ships
someone else's private key — the person running it locally generates their own
self-signed certificate and points `SSL_PFX_PATH` at it. HTTPS matters here
specifically because both the login request (carrying a password) and every
subsequent request (carrying a bearer token) would otherwise cross the network
in plain text, where either could be read or replayed by anyone on the same
path; encrypting the full request, including headers and cookies, is precisely
what TLS-backed HTTPS is designed to prevent.

### Error handling

A single error-handling middleware, mounted last in `app.js` as Express
requires for it to be reached at all, catches every thrown error and rejected
promise from anywhere in the request, including a body that failed to parse
before any route ran. Its one contract: nothing derived from the error object
reaches the response. The message sent to the caller is chosen from a fixed
table keyed by `error.type` (`entity.parse.failed`, `entity.too.large`, and a
generic fallback) — never `error.message`, never `error.stack`, never a path
from the parser. The full error is still logged server-side with
`console.error` for debugging.

This exists because, before the handler was written, a malformed JSON body
returned a raw stack trace containing the project's absolute file path — the
exact kind of internal detail the POE brief requires the API to never expose,
and the kind of security misconfiguration OWASP flags as a common route to
information disclosure.

## Getting Started

Prerequisites: Node.js ≥ 18.

```bash
cd api
npm install
cp .env.example .env      # then fill in JWT_SECRET
npm run dev                # nodemon, or npm start for a plain run
```

The API boots without a configured secret or certificate — it generates a
throwaway JWT secret and falls back to HTTP, both loudly logged — so a fresh
clone is runnable immediately. For a proper local run:

- Generate a signing secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and set it as `JWT_SECRET` in `.env`.
- Generate a local self-signed certificate, bundle it as a `.pfx`, and set `SSL_PFX_PATH` (and `SSL_PFX_PASSWORD` if protected) in `.env`. From inside `api/`:

  ```bash
  mkdir -p certs
  openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 \
    -keyout certs/localhost-key.pem -out certs/localhost-cert.pem -subj "/CN=localhost"
  openssl pkcs12 -export -out certs/localhost.pfx \
    -inkey certs/localhost-key.pem -in certs/localhost-cert.pem -passout pass:
  ```

  On Windows, if `openssl` isn't recognised in PowerShell, use Git Bash, or
  call Git's bundled copy directly (`"C:\Program Files\Git\usr\bin\openssl.exe"`).

- `npm run dev` and confirm the console reports `hustlehub+ api listening at https://localhost:5000`.

| Variable | Purpose | Default |
|---|---|---|
| `NODE_ENV` | `development` or `production` | `development` |
| `PORT` | Port the API listens on | `5000` |
| `JWT_SECRET` | Token signing secret | generated per-process if unset |
| `JWT_EXPIRES_IN` | Token lifetime | `1h` |
| `BCRYPT_ROUNDS` | bcrypt work factor | `12` (raised to 10 minimum) |
| `SSL_PFX_PATH` | Path to the local certificate bundle | `api/certs/localhost.pfx` |
| `SSL_PFX_PASSWORD` | Passphrase for the bundle | (blank) |

## API Endpoints

Verified by running the API locally against every scenario listed below, and
by the Postman collection described in [Testing](#testing).

| Method | Endpoint | Purpose | Auth | Expected response |
|---|---|---|---|---|
| GET | `/api/health` | Liveness probe | None | 200 — status, uptime, timestamp |
| POST | `/api/auth/register` | Create an account | None | 201 + safe user · 400 validation/invalid role · 409 duplicate email |
| POST | `/api/auth/login` | Authenticate, issue JWT | None (rate-limited) | 200 + safe user + token · 400 missing fields · 401 invalid credentials · 429 too many attempts |
| GET | `/api/auth/profile` | Return account behind token | Bearer JWT | 200 + safe user · 401 missing/invalid/expired token · 404 account gone |
| GET | `/api/auth/admin` | Role-restricted demo route | Bearer JWT + admin role | 200 · 401 no/invalid token · 403 wrong role |

## Testing

The API is tested with a Postman collection covering all 5 endpoints, plus the
required invalid-input scenarios: duplicate email, wrong password, missing
fields, and malformed JSON.

- **Collection:** [`docs/postman/HustleHub.postman_collection.json`](docs/postman/HustleHub.postman_collection.json)
- **Import instructions:** import the file into Postman, then disable "SSL
  certificate verification" in Postman's Settings → General (required because
  the API is served over a self-signed local certificate). Run the Register
  success request first, then Login success, before the Profile/Admin
  requests — the collection captures a test email and a bearer token
  automatically via request scripts.
- **Scenarios covered:**
  - Health: liveness check
  - Register: success, duplicate email (409), missing fields (400), invalid
    email format (400), weak password (400), disallowed role (400), malformed
    JSON body (400, safe error message only)
  - Login: success with token, wrong password (401), unknown email (401,
    identical message to wrong password), missing fields (400), malformed
    JSON (400), rate limiting (429 after repeated failures)
  - Profile: valid token (200), missing token (401), malformed token (401)
  - Admin: non-admin token (403), missing token (401)
- **Known gap:** the `/api/auth/admin` 200-success path (a valid admin token)
  cannot be demonstrated, because registration only allows self-assigning
  `client` or `freelancer` (`api/models/userModel.js`, `SELF_ASSIGNABLE_ROLES`)
  and no endpoint in this API creates an admin user. Only the 401 and 403
  cases are covered.
- **Screenshots:** response captures for every scenario above, organised by
  endpoint, are compiled in [`docs/submission-package.md`](docs/submission-package.md).

## Demonstration

A recorded walkthrough shows the API starting over HTTPS, registration, login
with token generation, and an authenticated profile call using that token.

- **Video:** TODO — link once recorded and uploaded.

The full submission package — GitHub link, this README, the Postman
collection, screenshots, and the video link — is compiled in
[`docs/submission-package.md`](docs/submission-package.md), written for
export to PDF.

## Team

| Role   | Responsibility       | Member |
| ------ | -------------------- | ------ |
| Role 1 | Backend / API Lead   |        |
| Role 2 | Security Specialist  |        |
| Role 3 | Architecture & Docs  |        |
| Role 4 | Testing & Submission |        |

## References

1. Express.js, "Error handling," OpenJS Foundation. Available: https://expressjs.com/en/guide/error-handling/ (Accessed: 30-Aug-2026).
2. OWASP Foundation, "Password Storage Cheat Sheet," OWASP Cheat Sheet Series. Available: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html (Accessed: 30-Aug-2026).
3. OWASP Foundation, "Authentication Cheat Sheet," OWASP Cheat Sheet Series. Available: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html (Accessed: 30-Aug-2026).
4. M. Jones, J. Bradley, and N. Sakimura, "JSON Web Token (JWT)," IETF, RFC 7519, May 2015. Available: https://www.rfc-editor.org/rfc/rfc7519.html (Accessed: 30-Aug-2026).
5. OWASP Foundation, "REST Security Cheat Sheet," OWASP Cheat Sheet Series. Available: https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html (Accessed: 30-Aug-2026).
6. OWASP Foundation, "Input Validation Cheat Sheet," OWASP Cheat Sheet Series. Available: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html (Accessed: 30-Aug-2026).
7. OWASP Foundation, "OWASP Top 10: 2021." Available: https://owasp.org/Top10/2021/ (Accessed: 30-Aug-2026).
8. P. A. Grassi et al., "Digital Identity Guidelines: Authentication and Lifecycle Management," National Institute of Standards and Technology, NIST Special Publication 800-63B, Jun. 2017. Available: https://pages.nist.gov/800-63-3/sp800-63b.html (Accessed: 30-Aug-2026).
9. Google Web Fundamentals, "Why HTTPS matters," web.dev. Available: https://web.dev/why-https-matters/ (Accessed: 30-Aug-2026).
10. dcodeIO, "bcryptjs: Optimized bcrypt in JavaScript with zero dependencies," npm. Available: https://www.npmjs.com/package/bcryptjs (Accessed: 30-Aug-2026).
11. N. Provos and D. Mazières, "A Future-Adaptable Password Scheme," in Proc. USENIX Annual Technical Conference, Monterey, CA, USA, 1999, pp. 81–91.
12. OpenJS Foundation, "Express — Node.js web application framework." Available: https://expressjs.com/ (Accessed: 30-Aug-2026).
