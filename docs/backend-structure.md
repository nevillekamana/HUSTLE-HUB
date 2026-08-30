# Backend structure notes

Reference material for Role 3 to fold into the README. Written by Role 1
(Backend/API Lead). Lift from it freely — headings here roughly match the README
sections they belong in.

---

## Overview

The backend is a Node.js and Express API. It has no database: users are held in a
JSON file behind a small datastore module, which keeps Part 1 self-contained while
leaving one obvious seam to swap for a real database later.

Every request follows the same path, and every response leaves through the same pair
of senders, so the API answers in one shape no matter which endpoint was hit.

---

## Folder responsibilities

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

`app.js` builds the application. `server.js` starts it. Keeping those apart means the
same app object can be wrapped in an HTTPS server without `app.js` changing.

---

## Request lifecycle

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

The order matters. `notFound` is second last and `errorHandler` is last; a route
registered below either of them would never run.

---

## Endpoints

| Method | Path | Auth | Success | Failures |
|---|---|---|---|---|
| GET | `/api/health` | none | 200 | — |
| POST | `/api/auth/register` | none | 201 + safe user | 400 failed validation, 400 bad role, 409 duplicate |
| POST | `/api/auth/login` | none | 200 + safe user + token | 400 missing fields, 401 bad credentials, 429 too many attempts |
| GET | `/api/auth/profile` | bearer token | 200 + safe user | 401 no/invalid token, 404 account gone |
| GET | `/api/auth/admin` | bearer token + admin role | 200 | 401 no/invalid token, 403 wrong role |

---

## Response format

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

---

## Security decisions

These are the choices worth explaining in the README's security section.

**Input is whitelisted, not blacklisted.** Validation middleware runs before every
registration and describes what a value may contain rather than trying to enumerate
what it may not, so an unanticipated character is refused by default. The patterns are
anchored at both ends, because an unanchored pattern matches a fragment and would accept
junk wrapped around a valid-looking substring, and none of them nests a quantifier inside
another, which is what makes an expression hang on a crafted input rather than fail on it.
Names allow letters, spaces, hyphens and apostrophes; passwords must be 8 to 128 characters
with at least one letter and one digit. Every field is checked before anything is reported,
so a caller fixing a bad request learns everything wrong with it in one reply.

**The password ceiling is a security control, not a formatting rule.** Hashing is
deliberately slow, so an unbounded password would be a cheap way to spend the server's
processor time.

**Login is validated more loosely than registration, on purpose.** It checks only that the
fields are present. A format rule there would answer a malformed address with a 400 while
every other failed attempt answers 401, and that difference would tell an attacker which
addresses are worth guessing at. A strength rule would be worse still: it would lock an
account out of its own login the moment the rule changed.

**Repeated login failures are throttled.** Five failed attempts from one client in a minute
are met with a 429. Successful logins are not counted, so brute force is checked without a
legitimate user being locked out of their own account.

**Passwords are never stored or logged in plain text.** The user model has no
parameter for a plain password — it accepts `passwordHash` only, so storing one by
accident would require changing the model. Hashing is bcrypt with a per-password
salt at a work factor of 12, and the configuration loader raises anything below 10
rather than trusting it.

**Responses cannot leak the password hash.** The serialiser is an allowlist: it
copies out the fields named as public rather than deleting the sensitive ones. A
field added later is private by default and has to be named to become visible.

**Login does not reveal which accounts exist.** An unknown address and a wrong
password produce the same 401 and byte-identical bodies, so a reply cannot be used
to discover registered addresses.

**Tokens carry as little as possible.** A JWT payload is base64, not encrypted, so
only an identifier and a role go in — no email, no name. Tokens are signed with a
secret that is never committed, and expire after an hour.

**`admin` cannot be self-assigned.** Registration accepts `client` or `freelancer`
only. `admin` exists as a stored role but is absent from the assignable list, so no
request body can produce one.

**Identity comes from the token, not the request.** The profile route reads the user
id out of the verified claims, so changing a query parameter cannot fetch someone
else's account.

**No error reveals anything internal.** A central handler answers from a fixed table
of messages rather than from the error object, so stack traces, file paths and parser
internals never reach a client. The full error still goes to the server log.

**Request bodies are capped at 10kb** and refused before being buffered, and the
framework's `x-powered-by` header is disabled.

---

## Running it

```bash
cd api
npm install
cp .env.example .env      # then fill in JWT_SECRET
npm run dev               # nodemon, or npm start for a plain run
```

The API boots without a `.env`, generating a throwaway signing secret for that run
and warning that it has done so. Tokens issued that way stop working when the process
restarts, which is the prompt to set a real secret.

---

## Notes for whoever writes the README

- The architecture diagram wants the request lifecycle above, not the folder table —
  the folders are reference, the lifecycle is the story.
- The security section is the one carrying real marks. Each decision above is written
  as a claim plus the reason; keep the reason, it is what separates a description from
  an explanation.
- Endpoint examples are best taken from the Postman collection once Role 4 has it, so
  the README and the tests cannot disagree.
