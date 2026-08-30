# Role 2 — Security Specialist handover

Written by Role 1 (Backend/API Lead) so you can start without waiting for me to finish, and
without being surprised by something I already decided. Everything below is either already
on `role1/backend-api` or is a constraint that will bite you if you do not know about it.

Branch: `role1/backend-api`. The backend code is not on `main` yet.

---

## 1. Start here — the two things blocking me

I cannot finish the register and login endpoints without these. They are the only files I
am waiting on.

### `api/services/passwordService.js`

```js
hashPassword(plainPassword)            //returns a promise resolving to a hash string
verifyPassword(plainPassword, hash)    //returns a promise resolving to a boolean
```

### `api/services/tokenService.js`

```js
generateToken(payload)                 //returns a signed token string
verifyToken(token)                     //returns the decoded payload, or throws
```

**Do not change these four signatures.** My controllers are written against them. Anything
you need beyond them — rounds, expiry, algorithm, issuer — belongs inside the module or in
`config/env.js`, not in the parameter list.

If you have not delivered these by the time I reach the controllers, I will write a minimal
bcrypt and jsonwebtoken version purely so the endpoints run, with a header comment saying
you own hardening it. That version is a placeholder for you to replace, not a finished
implementation — treat it as yours the moment you pick it up.

---

## 2. The one rule that is not negotiable

**A plain-text password must never be written to `users.json`, to a log, or to a response.
Not temporarily, not in a stub, not while debugging.**

The model is built so this is hard to get wrong: `buildUser()` accepts `passwordHash` and
has no parameter for a plain password. Keep it that way.

---

## 3. What already exists, and what you plug into

| File | State | Yours? |
|---|---|---|
| `api/app.js` | Built. Parsing, routes, terminal handlers wired | Mount your middleware here |
| `api/server.js` | Built. Calls `listen` | Yes — HTTPS goes here |
| `api/config/env.js` | Built. `nodeEnv`, `port` | Add your variables here |
| `api/store/jsonStore.js` | Built. Locked read/write | No |
| `api/models/userModel.js` | Built. Read section 5 below | Read section 5 first |
| `api/utils/apiResponse.js` | Built. `sendSuccess`, `sendFailure` | Use it, do not bypass it |
| `api/utils/httpStatus.js` | Built. Frozen constants | Use it, no magic numbers |
| `api/middleware/notFound.js` | Built | No |
| `api/middleware/errorHandler.js` | **Seam — yours.** Working, minimal | Yes |
| `api/routes/authRoutes.js` | Router exists, no handlers yet | Mount your middleware per route |
| `api/services/` | **Empty. Waiting on you** | Yes |
| Validation middleware | Does not exist yet | Yes — validation rules are yours |

---

## 4. Decisions already made that constrain you

### 4.1 This is Express 5, not Express 4

`express@^5.2.1`. Most tutorials and most of Stack Overflow are Express 4. Two differences
will cost you an afternoon if you do not know them:

- **`app.all('*', handler)` throws at startup.** Express 5 uses path-to-regexp v8 and a bare
  `'*'` is no longer a valid path. Use `app.use(handler)`, or a named wildcard such as
  `'/*splat'`. This is why `notFound` is mounted with `app.use`.
- **Async errors forward themselves.** An `async` handler that throws or rejects reaches the
  error handler automatically. You do not need `express-async-handler`, and you do not need
  a try/catch in every controller. This is already tested and working.

### 4.2 Every response uses one envelope

```json
{ "success": true,  "message": "user registered successfully", "data": {} }
{ "success": false, "message": "email already registered",     "errors": [] }
```

Send them with `sendSuccess(res, status, message, data)` and
`sendFailure(res, status, message, errors)`. Success bodies carry `data` and never `errors`;
failure bodies carry `errors` and never `data`. Do not call `res.json` directly — if the
shape drifts between endpoints we lose a rubric row.

For field-level validation, `errors` is where the detail goes:

```js
sendFailure(res, httpStatus.BAD_REQUEST, 'validation failed', [
  { field: 'email', message: 'must be a valid email address' }
]);
```

### 4.3 Middleware order in `app.js` is load-bearing

```
express.json({ limit: '10kb' })     <- body parsing
app.use('/api/auth', authRoutes)    <- routes
app.use(notFound)                   <- 404, must stay second last
app.use(errorHandler)               <- must stay last
```

Anything you add — helmet, cors, rate limiting, an HTTPS redirect — goes **above** the
routes. Anything mounted below `notFound` will never run. There is a comment in `app.js`
saying so.

### 4.4 Already done, do not redo

- `app.disable('x-powered-by')` — the framework no longer advertises itself. If you add
  helmet, check you have not switched it back on.
- `app.set('trust proxy', 1)` — set so client IPs stay correct behind your HTTPS
  termination. Your rate limiter will depend on this being right.
- `express.json({ limit: '10kb' })` — an oversized body is refused before it is buffered,
  and comes back as a 413 through the error handler.
- `.gitignore` already excludes `*.pem`, `*.key`, `*.crt` and `.env`. Your certificates and
  secrets will not be committed by accident.

### 4.5 Nothing reads `process.env` except `config/env.js`

```js
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: readNumber(process.env.PORT, 5000)
};
```

Add `jwtSecret`, `jwtExpiresIn`, `bcryptRounds`, `sslKeyPath`, `sslCertPath` **there**, and
import `env` where you need them. One place to audit is worth more than the convenience of
reading `process.env` inline. The same names need to go in `.env.example` — I create that
file at commit 27, so either tell me what you need before then or add them yourself.

### 4.6 HTTPS: `app.js` deliberately does not listen

`app.js` exports the configured app without binding a port; `server.js` owns the binding.
That split exists so you can do this without touching `app.js` at all:

```js
https.createServer({ key, cert }, app).listen(env.port);
```

---

## 5. `userModel.js` — the one that will catch you out

`toPublicUser()` is an **allowlist**, not a strip. It copies out the fields named in
`PUBLIC_FIELDS`, which is `USER_FIELDS` minus `SENSITIVE_FIELDS`. Anything not named is
silently dropped.

So if you add a field to a user record — `failedLoginAttempts`, `lockedUntil`,
`passwordResetToken`, whatever — then:

- add it to `USER_FIELDS`, or it will never appear in a response even when you want it to;
- **and** add it to `SENSITIVE_FIELDS` if it must not be public, or it will be returned.

The safe default is "dropped", which is why it is built this way. But it does mean a field
you add and forget about will look like it vanished rather than raising an error.

Other things worth knowing:

- `createUser()` does its duplicate check **inside** the datastore lock, so two simultaneous
  registrations for one address cannot both succeed. It throws an error carrying
  `code === EMAIL_TAKEN`. Branch on that exported constant, not on the message text.
- Emails are stored lowercase and trimmed. `findUserByEmail()` normalises its argument, so
  you never need to normalise before calling it.
- `ROLES.ADMIN` exists but is not in `SELF_ASSIGNABLE_ROLES`. Public registration can only
  ever produce `client` or `freelancer`. If you build role checks, that is your guarantee.

---

## 6. `errorHandler.js` — your seam, and its one contract

It works today: it catches malformed JSON, oversized bodies, thrown errors and rejected
promises, and answers in the standard envelope with a 400, 413 or 500. Extend it freely.

**The contract you must not break: nothing derived from the error object reaches the
response.** Not `error.message`, not `error.stack`, not a path from a parser. The message
sent to the caller is chosen from a fixed table keyed by `error.type`:

```js
const SAFE_MESSAGES = Object.freeze({
  'entity.parse.failed': 'the request body is not valid json',
  'entity.too.large': 'the request body is too large',
  fallback: 'an unexpected error occurred'
});
```

Add entries to that table. The full error still goes to `console.error` server-side, so
nothing is lost for debugging.

Why this matters: before this handler existed, a malformed JSON body returned a stack trace
containing the absolute path of the project directory, which included a home directory and a
school name. Controlled error responses are an explicit POE requirement and a rubric row.

Two mechanical details. Keep all four parameters `(error, req, res, next)` — Express
identifies an error handler by its arity, and a three-parameter version silently never runs.
And keep the `res.headersSent` guard at the top, so a failure part way through a reply does
not corrupt it.

---

## 7. Things I am assuming, that are yours to decide

Not my scope, and I have deliberately not pre-empted them. Flag it early if you disagree,
because several of these change my controllers:

- **Hashing algorithm and cost.** I assume bcrypt. If you prefer argon2, say so now.
- **Token transport.** I assume a bearer token in the `Authorization` header, returned in
  the login response body. If you want an httpOnly cookie instead, my login controller
  changes and so does Role 4's Postman collection.
- **Token payload.** I assume `{ id, role }`. Do not put the email or anything sensitive in
  it — a JWT payload is base64, not encrypted, and anyone holding the token can read it.
- **Validation library.** express-validator, joi, zod or hand-rolled — your call. Whatever
  you pick, the failure must come back through `sendFailure` in the shape in 4.2.
- **Login must not reveal whether an email exists.** The definition of done requires the
  same 401 and the same message for "no such user" and "wrong password". Worth also running
  the hash comparison even when no user was found, so the two paths take similar time.

---

## 8. Style, so our files read as one codebase

Section banners, roughly centred, uppercase title:

```js
//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\
```

Two to five per file. Any file another role takes over gets this at the top:

```js
//-----------------------------------------------------\\
//                    SEAM — ROLE 2 OWNS THIS
//-----------------------------------------------------\\
//role 1 defines the interface only, role 2 implements the internals
```

Comments are lowercase, with no space after the slashes, and say *why* rather than what.
Single quotes. `async`/`await`, not `.then()` chains. Status codes come from
`utils/httpStatus.js`, never as bare numbers.

---

## 9. Working agreement

- Branch off `main` as `role2/security`. Do not commit on `role1/backend-api`.
- Never rewrite shared history — no `--amend`, no rebase, no force push. Commit count and
  message quality are graded, and `main` carries a deliberate two-root merge that a rebase
  would wreck.
- Small commits with real messages. The repository itself is marked on this.
- If you need a signature or a mount point changed, ask before changing it. I will almost
  always say yes, but my controllers are written against these interfaces.

Ping me when the two service files land and I will wire the endpoints the same day.
