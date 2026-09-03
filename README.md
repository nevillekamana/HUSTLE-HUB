# HustleHub+

A secure freelance marketplace platform that allows freelancers to advertise
services and clients to browse and book those services. The system will
record the financial transactions generated through bookings and give
freelancers an indication of income earned and estimated tax obligations.

This document covers **Part 1 — Secure Foundations**: the backend API,
authentication, and the security decisions behind it. Marketplace features
(gigs, bookings, transactions, tax estimation), the React frontend, and
DevSecOps work are out of scope for this part and will be documented as they
are built in Parts 2 and 3.

---

## Table of Contents

- [Overview](#overview)
- [Intended Users](#intended-users)
- [System Architecture](#system-architecture)
- [Backend Structure](#backend-structure)
- [Registration and Login](#registration-and-login)
- [Security Decisions](#security-decisions)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Demonstration](#demonstration)
- [Team](#team)

---

## Overview

HustleHub+ is a freelance marketplace: freelancers advertise services
("gigs"), and clients browse and book them. Because the platform will go on
to handle account credentials, booking records, and income and tax data, Part
1 treats security as a foundation rather than something bolted on afterward —
the backend built here is a small, self-contained authentication API that
Parts 2 and 3 extend rather than rework.

## Intended Users

The platform is designed around three roles. Part 1 implements the first two;
`admin` is a reserved role that exists in the data model but cannot yet be
reached, since the marketplace features it will administer don't exist yet.

| Role | Description | Status in Part 1 |
|---|---|---|
| **Client** | Books gigs from freelancers. Default role on registration. | Can register and log in |
| **Freelancer** | Advertises gigs and tracks income from bookings. | Can register and log in |
| **Admin** | Platform oversight (Part 2+). | Reserved role; not self-assignable, no admin account can currently be created |

## System Architecture

The diagram below reflects the MERN architecture as it stands at the end of
Part 1: a client sends a request over HTTPS into the Express backend, which
passes it through a request pipeline before domain logic touches storage. The
"M" and the "F" of MERN are placeholders at this stage — user data is held in
a locked JSON file rather than MongoDB, and the client is not yet built —
both are explicit, scheduled Part 2 work rather than gaps in Part 1.

```
![image](https://github.com/EMWCCN/insy7314-2026-g2-insy7314-2026-hustlehub-plus-part1-st10434131/blob/e530b550b90864441cb5cb7f1d35dfdefb75d8a1/MERN%20DIAGRAM.png)
```

**System boundary.** Everything inside the outer box is the API process; the
client and the eventual MongoDB deployment sit outside it. The only way in is
through the request pipeline — there is no code path that reaches the domain
logic or the store without first passing validation and, on protected routes,
JWT verification.

## Backend Structure

The backend is a Node.js and Express API with no database yet: users are held
in a JSON file behind a small datastore module, which keeps Part 1
self-contained while leaving one clear seam to swap in MongoDB later. Every
request follows the same path in, and every response leaves through the same
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

`app.js` builds the Express application and exports it without starting a
listener. `server.js` starts it, choosing HTTPS or HTTP depending on whether a
certificate is present (see [HTTPS](#https)). Keeping those two files apart
means the same app object can be wrapped in an HTTPS server, or imported
directly by a test runner in Part 2, without `app.js` changing.

**Request lifecycle:**

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

The order is load-bearing: `notFound` is mounted second-last and
`errorHandler` last, so a route registered below either of them would never
run.

**Response envelope.** Every response uses one of two shapes. Success bodies
carry `data` and never `errors`; failure bodies carry `errors` and never
`data`.

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

## Registration and Login

### Registration flow

1. The client sends `POST /api/auth/register` with `fullName`, `email`,
   `password`, and an optional `role`, over HTTPS.
2. `express.json` parses the body (rejecting anything over 10kb before it is
   even buffered).
3. `validateRegister` checks every field before reporting anything, so one
   reply lists everything wrong with the request rather than one fault at a
   time: full name (2–100 characters, letters/spaces/hyphens/apostrophes
   only), email (valid format, ≤254 characters), password (8–128 characters,
   at least one letter and one digit), and role (if present, must be a
   string).
4. The controller resolves the requested role — `client` or `freelancer`
   only; `admin` is a real stored role but is not in the self-assignable
   list, so no request body can produce one.
5. The controller looks up the email first, so an obvious duplicate does not
   pay for a bcrypt run, and returns `409 Conflict` if it is already
   registered.
6. The password is hashed with bcrypt (work factor from config, minimum 10)
   — the plain password travels no further than the controller; only the
   hash is passed to the model.
7. The user model builds the record and writes it through the JSON store,
   whose duplicate check re-runs **inside the same file lock** as the
   insert, closing the race window between steps 5 and 7.
8. The response returns `201 Created` with the safe user object (never the
   password hash).

### Login flow

1. The client sends `POST /api/auth/login` with `email` and `password`.
2. A per-client rate limiter allows 5 failed attempts per minute before
   replying `429 Too Many Requests`; successful logins don't count against
   the limit, so a legitimate user is never locked out of their own account.
3. `validateLogin` checks only that both fields are present — deliberately
   looser than registration (see [Security Decisions](#input-validation)).
4. The controller looks up the user by email and compares the supplied
   password against the stored hash with bcrypt. An unknown email and a
   wrong password return the **same** `401 Unauthorized` with the same
   message, so a reply can't be used to discover which addresses are
   registered.
5. On a match, `tokenService.generateToken({ id, role })` issues a JWT signed
   with the server's secret, expiring after the configured lifetime
   (default 1 hour).
6. The response returns `200 OK` with the safe user object and the token.
7. For subsequent requests, the client sends the token as
   `Authorization: Bearer <token>`.
8. `requireAuth` extracts and verifies the token on every protected route.
   A missing, malformed, expired, or forged token all produce the same
   `401 Unauthorized` — the middleware never reveals which case occurred.
   On success, the verified `id` and `role` are attached to `req.auth` for
   the handler behind it.
9. `authorizeRoles(...)` (used on `/api/auth/admin`) runs after
   `requireAuth` and checks `req.auth.role` against an allow-list, replying
   `403 Forbidden` for a known but unpermitted caller.

## Security Decisions

Each decision below is a deliberate trade-off, not just a feature checklist —
the reasoning is what the code actually does, verified by inspection and by
running the API locally.

### Password Hashing

Passwords are hashed with **bcrypt** (`bcryptjs`, the pure-JavaScript build,
chosen so the project installs without native build tools on any machine) at
a work factor of 12, and the config loader raises anything below 10 rather
than trusting it. Hashing — rather than encryption — is used because it is
one-way: there is no key that decrypts a hash back to the original password,
so a stolen hash cannot be reversed to recover the credential, only guessed
against. Plain-text passwords are never retained: the user model's
`buildUser()` accepts `passwordHash` and has no parameter for a plain
password at all, so storing one by accident would require changing the
model, not just a call site. The `toPublicUser()` serialiser is an
**allowlist** — it copies out the fields named as public rather than
deleting the sensitive ones — so a field added to a user record later is
private by default and has to be deliberately named to become visible in a
response. The password length ceiling (128 characters) is itself a security
control: hashing is deliberately slow, so an unbounded password would be a
cheap way to spend the server's processor time.

### Token-Based Authentication (JWT)

A JWT is issued on successful login via `jsonwebtoken`, signed with a secret
read from `JWT_SECRET` and expiring after `JWT_EXPIRES_IN` (default `1h`).
The payload is deliberately minimal — `{ id, role }` — because a JWT payload
is base64-encoded, not encrypted, so anyone holding the token can read it;
no email or name is included. On every protected request, `requireAuth`
extracts the bearer token from the `Authorization` header and verifies it
against the same secret; the verified `id` and `role` (not anything the
caller typed) are what the rest of the request trusts. If `JWT_SECRET` is
left unset, the API still boots — it generates a throwaway secret for that
process only and logs a warning — which keeps a fresh clone runnable but
means every token issued that way stops verifying the moment the process
restarts, which is the intended nudge to set a real secret.

### Input Validation

Validation is **whitelist-based**: patterns describe what a value may
contain rather than trying to enumerate what it may not, so a character
nobody anticipated is refused by default. Every pattern is anchored at both
ends (`^...$`), because an unanchored pattern matches a fragment and would
accept junk wrapped around a valid-looking substring. Registration validates
full name, email format and length, and password length/strength; login
validates only that both fields are present. That asymmetry is intentional:
a format rule on login would answer a malformed email with `400` while every
other failed login answers `401`, and that difference would tell an attacker
which addresses are worth guessing at — so login is checked as loosely as
correctness allows, and everything else is rejected before it reaches
business logic.

### HTTPS

`server.js` looks for a PFX certificate bundle at the path configured by
`SSL_PFX_PATH` (default `api/certs/localhost.pfx`). If it's present, the app
is served with `https.createServer({ pfx, passphrase }, app)`; if it's
absent, the server falls back to plain HTTP and logs a visible warning
(`no certificate found, starting over http instead of https`) rather than
failing silently. Certificate and key material is excluded by `.gitignore`
(`*.pem`, `*.key`, `*.crt`, `*.pfx`, `*.p12`), so a fresh clone never ships
someone else's private key — the person running it locally generates their
own self-signed certificate and points `SSL_PFX_PATH` at it. HTTPS matters
here specifically because both the login request (carrying a password) and
every subsequent request (carrying a bearer token) would otherwise cross the
network in plain text, where either could be read or replayed by anyone on
the same path.

### Error Handling

A single error-handling middleware, mounted last in `app.js`, catches every
thrown error and rejected promise from anywhere in the request — including a
body that failed to parse before any route ran. Its one contract: **nothing
derived from the error object reaches the response.** The message sent to
the caller is chosen from a fixed table keyed by `error.type`
(`entity.parse.failed`, `entity.too.large`, and a generic fallback) — never
`error.message`, never `error.stack`, never a path from the parser. The full
error is still logged server-side with `console.error` for debugging. This
exists because, before the handler was written, a malformed JSON body
returned a raw stack trace containing the project's absolute file path —
exactly the kind of internal detail the POE brief requires the API to never
expose.

## Getting Started

**Prerequisites:** Node.js ≥ 18.

```bash
cd api
npm install
cp .env.example .env      # then fill in JWT_SECRET
npm run dev                # nodemon, or npm start for a plain run
```

The API boots without a configured secret or certificate — it generates a
throwaway JWT secret and falls back to HTTP, both loudly logged — so a fresh
clone is runnable immediately. For a proper local run:

1. Generate a signing secret:
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   and set it as `JWT_SECRET` in `.env`.
2. Generate a local self-signed certificate, bundle it as a `.pfx`, and set
   `SSL_PFX_PATH` (and `SSL_PFX_PASSWORD` if the bundle is password
   protected) in `.env`.
3. `npm run dev` and confirm the console reports
   `hustlehub+ api listening at https://localhost:5000`.

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

Verified by running the API locally against every scenario listed below.

| Method | Endpoint | Purpose | Authentication | Expected Response |
|---|---|---|---|---|
| GET | `/api/health` | Liveness probe | None | `200` — status, uptime, timestamp |
| POST | `/api/auth/register` | Create an account | None | `201` + safe user · `400` validation/invalid role · `409` duplicate email |
| POST | `/api/auth/login` | Authenticate and issue a JWT | None (rate-limited) | `200` + safe user + token · `400` missing fields · `401` invalid credentials · `429` too many attempts |
| GET | `/api/auth/profile` | Return the account behind the token | Bearer JWT | `200` + safe user · `401` missing/invalid/expired token · `404` account no longer exists |
| GET | `/api/auth/admin` | Demonstrates a role-restricted route | Bearer JWT + `admin` role | `200` · `401` no/invalid token · `403` wrong role |

## Testing

_Role 4 to complete this section with the Postman collection, Newman/manual
execution evidence, and response screenshots once available. Every endpoint
above, plus the invalid-input and duplicate-user cases already implemented in
the validation layer, should be represented in the collection._

## Demonstration

_Role 4 to add the demonstration video link here, showing the API running,
a successful registration, and a login that returns a token._

## Team

| Role | Responsibility | Member |
|---|---|---|
| Role 1 | Backend / API Lead | Morgan - ST10257779|
| Role 2 | Security Specialist | Christiaan - ST10434131|
| Role 3 | Architecture & Docs |Neville - St10404539 |
| Role 4 | Testing & Submission |Ethan -  ST10444972|
