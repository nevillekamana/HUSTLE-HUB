# HustleHub+

A secure freelance marketplace. Freelancers list services ("gigs"), clients browse and book them, and every booking creates a transaction record that feeds the freelancer's income summary. It is a MERN application (MongoDB, Express, React, Node.js) built with security as a primary requirement rather than something added afterwards.

This README covers two parts of the project:

- **Part 1, Secure Foundations:** the Express API, registration, login, password hashing, JWT, HTTPS, input validation and safe errors.
- **Part 2, Secure Stack:** MongoDB, gigs, bookings, transactions, freelancer income, role-based access control, the React client, input sanitisation, rate limiting, security headers with a Content Security Policy, and automated backend and frontend tests.

Part 3 (tax estimation, the income dashboard, CI/CD, Docker and logging) is planned and is not part of this version.

---

## Table of Contents

- [What is new in Part 2](#what-is-new-in-part-2)
- [Overview](#overview)
- [Intended Users](#intended-users)
- [System Architecture](#system-architecture)
- [Repository Structure](#repository-structure)
- [How a Request Is Handled](#how-a-request-is-handled)
- [Data Model](#data-model)
- [Marketplace Flow](#marketplace-flow)
- [Registration and Login](#registration-and-login)
- [Security Measures](#security-measures)
- [The React Client](#the-react-client)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Screenshots](#screenshots)
- [Demonstration](#demonstration)
- [Known Limitations](#known-limitations)
- [Team](#team)

---

## What is new in Part 2

| Area | Part 1 | Part 2 |
|---|---|---|
| Storage | Locked JSON file | MongoDB with Mongoose |
| Marketplace | None | Gigs, bookings, simulated payment, transactions, freelancer income |
| Access control | One admin-only demonstration route | Role-based access control on every route, plus ownership checks |
| Admin accounts | Could not be created | Created with `npm run seed:admin`; registration still refuses the admin role |
| Input safety | Whitelist validation | Validation on every route, NoSQL injection and XSS sanitisation |
| Abuse protection | Failed-login limit | Limits on the whole API, failed logins, registrations and bookings |
| Browser protection | None | Helmet security headers with a strict Content Security Policy |
| Client | None | React application with role-aware navigation |
| Testing | Postman collection | Security check script, Postman collection run with Newman, frontend tests |

## Overview

Freelancers advertise services ("gigs") and clients browse and book them. Payment is simulated: a booking returns a confirmation and a payment reference, and always creates a transaction record linked to both the client and the freelancer. A freelancer's income is calculated from their completed transactions.

The platform holds account credentials, booking records and income data, so every route is protected from the moment it is added. A request must carry a valid token, pass its role check and its input checks, and, where it touches a user's own data, pass an ownership check, before any business logic runs.

## Intended Users

| Role | What they can do | How the account is created |
|---|---|---|
| **Client** | Browse gigs, book a gig, view their own bookings and transactions | Register |
| **Freelancer** | Create, update and delete their own gigs, view bookings on their gigs, view their own transactions and income | Register |
| **Admin** | View all users and all transactions, remove any gig | `npm run seed:admin` only. Registration refuses the admin role whatever the request says |

## System Architecture

A request travels from the React client into the Express API, through a fixed pipeline of security steps, then to the routes, services and Mongoose models, and finally to MongoDB. Anything that goes wrong on the way leaves through one central error handler that returns a safe message.

```mermaid
flowchart TD
    Browser["React client (Vite dev server)"]
    subgraph API["HustleHub+ API process (Node.js and Express)"]
        direction TB
        H["Helmet security headers and CSP"]
        RL["API rate limiter, 300 per minute per IP"]
        BP["JSON body parser, 10 kb limit"]
        SAN["Sanitisation: NoSQL operators and XSS"]
        JWT["JWT check on every route except health, register and login"]
        POL["Route policy: role, id and field validation, login and booking limits"]
        RT["Routes and controllers with ownership checks using the token id"]
        SVC["Services: passwords, tokens, bookings, simulated payment, income"]
        MOD["Mongoose models: User, Gig, Booking, Transaction"]
        EH["Central error handler"]
        H --> RL --> BP --> SAN --> JWT --> POL --> RT --> SVC --> MOD
        RT -.->|"on error"| EH
    end
    DB[("MongoDB")]
    Browser -->|"HTTPS requests to /api"| H
    MOD --> DB
    EH -.->|"safe JSON error"| Browser
```

**System boundary.** Everything inside the box is the API process. The browser and MongoDB sit outside it. The only way in is the pipeline: no code path reaches a route, a service or the database without first passing the security steps, and the error handler never returns anything derived from the error itself (no stack traces, file paths or database messages).

## Repository Structure

```text
api/
  config/        env.js, db.js, security.js, accessPolicy.js, routePolicy.js
  controllers/   auth, gig, booking, transaction, income, admin
  middleware/    securityHeaders, rateLimit, sanitize, apiGuard, requireAuth,
                 routeGuard, resourceValidation, validation, role, notFound, errorHandler
  models/        user, gig, booking, transaction
  routes/        index, auth, gig, booking, transaction, income, admin
  scripts/       securityCheck.js, seedAdmin.js, seedDemo.js
  services/      password, token, booking, payment, income
  utils/         apiResponse.js, httpStatus.js
client/
  src/           pages, components, auth, api, hooks, utils, test
docs/
  security.md, testing.md, postman-guide.md
  postman/       collection and environment
  newman/        Newman evidence and the run script
  frontend-tests/ Vitest output
  screenshots/   Part 1 and Part 2 screenshots
  diagrams/      Part 1 architecture and authentication diagrams
```

`app.js` builds the Express application and exports it without starting a listener. `server.js` starts it over HTTPS when a certificate is present and over HTTP otherwise. Every response uses the same envelope:

```json
{ "success": true,  "message": "gig created", "data": { } }
{ "success": false, "message": "validation failed", "errors": [ { "field": "title", "message": "must be between 3 and 100 characters" } ] }
```

## How a Request Is Handled

Requests pass these steps in this order (`api/app.js`). A request that fails a step is answered there and goes no further.

| # | Step | Refuses with |
|---|---|---|
| 1 | Security headers (Helmet and CSP) | |
| 2 | Rate limit for the whole API | 429 |
| 3 | JSON body parser, 10 kb limit | 400, 413 |
| 4 | Sanitisation (NoSQL injection, XSS) | 400 |
| 5 | JWT check on every route that is not public | 401 |
| 6 | Route policy: role check, id check, field validation, login and booking limits | 403, 400, 429 |
| 7 | The route itself, which adds the ownership check | 403, 404 |
| 8 | Not found handler and central error handler | 404, 500 with a fixed message |

Public routes are only `GET /api/health`, `POST /api/auth/register` and `POST /api/auth/login`. A new route is protected the moment it is added.

## Data Model

| Model | Main fields |
|---|---|
| **User** | full name, email (unique, lower case), password hash (never returned), role: client, freelancer or admin |
| **Gig** | freelancer (owner), title, description, category, `priceCents`, `isActive` |
| **Booking** | gig, client, freelancer (copied from the gig's owner), `priceCents` (the gig's price at booking time), status: confirmed or cancelled |
| **Transaction** | booking (unique), client, freelancer, `amountCents`, currency (ZAR), status: completed, simulated payment reference |

Money is stored as whole numbers of cents so amounts never drift through rounding. Deleting a gig deactivates it (`isActive: false`): it disappears from browsing and can no longer be booked, but its bookings, transactions and the freelancer's income are kept.

## Marketplace Flow

1. **A freelancer creates a gig.** The owner is taken from the verified token, never from the request body, and any attempt to send an owner is refused.
2. **A client browses gigs.** The list is paged and can be filtered by category, search text and price range.
3. **A client books a gig** with `POST /api/bookings` and only a `gigId`. The price and the freelancer come from the stored gig, so a client cannot choose either. A simulated payment returns a reference, then a booking and a transaction are created together. With a replica set (Atlas, or a local instance started with one) this is a real MongoDB transaction. On a standalone local instance a compensating delete removes the booking if the transaction record fails to write.
4. **Both parties see the booking.** A client sees the bookings they made. A freelancer sees bookings on their gigs. Anyone else gets a 404, which does not reveal that the booking exists.
5. **Income is calculated, not stored.** `GET /api/income/me` aggregates the freelancer's completed transactions into a total, a transaction count, and breakdowns by gig and by month, so the figure can never drift out of step with the transactions.

## Registration and Login

![Authentication flow](docs/diagrams/auth-flow-diagram.png)

*The authentication flow is unchanged from Part 1.*

**Registration** (`POST /api/auth/register`): the body is size-limited, sanitised and validated (full name, email, password of 8 to 128 characters with at least one letter and one digit, and a role of `client` or `freelancer`). A duplicate email returns 409. The password is hashed with bcrypt before it reaches the model, and the response returns the safe user object without the hash.

**Login** (`POST /api/auth/login`): a failed-login rate limit applies, then the password is compared with the stored hash. An unknown email and a wrong password return the identical 401 and message, so the reply cannot be used to find out which addresses are registered. On success a JWT carrying only `{ id, role }` is returned. The client sends it on every later request as `Authorization: Bearer <token>`.

## Security Measures

The full write-up, with every limit and rule, is in [docs/security.md](docs/security.md). In summary:

| Control | What it does |
|---|---|
| **Password hashing** | bcrypt (`bcryptjs`) with a work factor of 12, raised to a minimum of 10. Plain-text passwords are never stored: the user model's builder accepts a hash and has no parameter for a plain password. Responses use an allowlist serialiser, so a new field is private by default |
| **JWT** | HS256 tokens signed with `JWT_SECRET`, one hour by default. The payload is only `{ id, role }`. Missing, expired, forged, unsigned (`alg: none`) and malformed tokens all receive the same 401. Only the verified `id` and `role` are trusted |
| **Role-based access control** | One row per protected address in `config/routePolicy.js`, enforced in a single place, so a route cannot be added without a role check |
| **Ownership checks** | A freelancer can only change their own gigs, and a user only sees their own bookings and transactions. Routes check this against the database using the token's id. Resources a user does not own answer 404 |
| **Input validation** | Whitelist rules on every field. A field that is not in the rules is refused, so a caller cannot send a gig's owner or a booking's price. Malformed ids return 400, not a crash |
| **Sanitisation** | Keys starting with `$`, containing `.`, or named `__proto__`, `constructor` or `prototype` are refused with 400 (NoSQL injection). HTML tags are stripped from all text and the content of script and style tags is dropped (XSS) |
| **Rate limiting** | 300 requests per minute per IP for the API, 5 failed logins per minute per IP, 30 registrations per 15 minutes per IP, and 10 bookings per minute per signed-in user. A blocked request returns 429 with a `Retry-After` header and a message saying which limit was hit |
| **Security headers** | Helmet with a strict Content Security Policy: `default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; sandbox`. Also `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Cross-Origin-Resource-Policy`, `Permissions-Policy` and `Cache-Control: no-store`. `X-Powered-By` is removed |
| **HTTPS** | When a certificate bundle is present the API is served with `https.createServer`, otherwise it falls back to HTTP and says so. Login passwords and bearer tokens would otherwise cross the network in plain text |
| **Safe errors** | One error handler returns messages from a fixed table. Nothing from the error object (message, stack, path, database text) reaches the response. The full error is logged server-side |
| **Client storage** | The token is kept in `sessionStorage` and in memory only, never in a URL or a log |

The security check script exercises these controls directly:

```powershell
cd api
npm run security:check
```

## The React Client

The client is a React application built with Vite, React Router and Tailwind CSS. It calls only relative `/api` paths. In development Vite proxies those to the API, so the browser never meets the self-signed certificate or a cross-origin request.

| Page | Address | Who sees it |
|---|---|---|
| Register, Login | `/register`, `/login` | Everyone |
| Browse gigs, gig detail and booking | `/gigs`, `/gigs/:id` | All signed-in roles; booking is for clients |
| My gigs | `/my-gigs` | Freelancers |
| My bookings | `/bookings` | Clients and freelancers |
| Transactions | `/transactions` | Clients and freelancers |
| Income summary | `/income` | Freelancers |
| Admin | `/admin` | Admins |

- **Role-aware navigation and route guards** show each role only its own pages. These are for usability only: the API is the real enforcement and refuses the rest even if an address is typed in.
- **Client-side validation** uses the same limits as the API, so most mistakes are caught before a request is sent.
- **Errors are handled gracefully.** An expired session, a 403 and a 404 are shown as fixed plain sentences. Validation, duplicate-email and rate-limit messages come from the API, which writes them for users. The client never renders a raw error object, a stack trace or an unexpected server message.

## Getting Started

**Prerequisites:** Node.js (the API needs 18 or newer; the frontend test dependencies warn on anything older than 22.22 or 24.15) and MongoDB, either a local installation running as a service or an Atlas cluster with your IP address allowed.

### 1. The API

```powershell
cd api
npm install
copy .env.example .env
```

Open `.env` and set:

- `JWT_SECRET`: generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. If it is left blank the API still starts with a throwaway secret, but every token stops working when it restarts.
- `MONGO_URI`: `mongodb://127.0.0.1:27017/hustlehub` for a local instance, or your Atlas connection string.

| Variable | Purpose | Default |
|---|---|---|
| `NODE_ENV` | `development` or `production` | `development` |
| `PORT` | Port the API listens on | `5000` |
| `JWT_SECRET` | Token signing secret | generated per process if unset |
| `JWT_EXPIRES_IN` | Token lifetime | `1h` |
| `BCRYPT_ROUNDS` | bcrypt work factor | `12` (raised to 10 minimum) |
| `MONGO_URI` | MongoDB connection string | local instance in development; required elsewhere |
| `TRUST_PROXY` | Trust forwarded addresses, only behind a real reverse proxy | `false` |
| `SSL_PFX_PATH` | Certificate bundle | `api/certs/localhost.pfx` |
| `SSL_PFX_PASSWORD` | Bundle passphrase | blank |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME` | Used only by `npm run seed:admin` | none |
| `RATE_LIMIT_*_MAX`, `RATE_LIMIT_*_WINDOW_MS` | Override any rate limit (see `.env.example`) | see Security Measures |

### 2. HTTPS certificate

The client's development proxy talks to `https://localhost:5000`, so run the API over HTTPS. From inside `api/`, in PowerShell:

```powershell
mkdir certs
& "C:\Program Files\Git\usr\bin\openssl.exe" req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 -keyout certs/localhost-key.pem -out certs/localhost-cert.pem -subj "/CN=localhost"
& "C:\Program Files\Git\usr\bin\openssl.exe" pkcs12 -export -out certs/localhost.pfx -inkey certs/localhost-key.pem -in certs/localhost-cert.pem -passout pass:
```

Certificate and key files are excluded by `.gitignore`, so a clone never inherits someone else's private key. On macOS or Linux use `openssl` directly.

### 3. Create accounts and start

```powershell
$env:ADMIN_EMAIL = "admin@hustlehub.test"
$env:ADMIN_PASSWORD = "<choose a password>"
$env:ADMIN_FULL_NAME = "Admin"
npm run seed:admin      # the only way an admin account can exist
npm run seed:demo       # optional: two freelancers, one client and six gigs
npm start               # or npm run dev for nodemon
```

`npm run seed:demo` creates `demo.freelancer1@hustlehub.test`, `demo.freelancer2@hustlehub.test` and `demo.client@hustlehub.test`, all with the password `Password123`, for local development and the demonstration only. It refuses to run in production.

Confirm the console reports `hustlehub+ api listening at https://localhost:5000`.

### 4. The client

In a second terminal:

```powershell
cd client
npm install
npm run dev
```

Open the address Vite prints (normally `http://localhost:5173`). Other client scripts are `npm run build`, `npm run lint` and `npm test`.

## API Endpoints

All addresses start with `/api`. Every route needs a bearer token except the three marked public. Responses use the envelope shown earlier.

| Method | Endpoint | Who may call it | Ownership | Purpose |
|---|---|---|---|---|
| GET | `/health` | Public | | Liveness probe |
| POST | `/auth/register` | Public (rate limited) | | Create a client or freelancer account |
| POST | `/auth/login` | Public (rate limited) | | Log in and receive a JWT |
| GET | `/auth/profile` | Any signed-in user | Self | The account behind the token |
| GET | `/auth/admin` | Admin | | Demonstration of an admin-only route |
| GET | `/gigs` | Any signed-in user | | Browse active gigs: `page`, `limit`, `category`, `q`, `minPrice`, `maxPrice` |
| GET | `/gigs/mine` | Freelancer | Own gigs | The freelancer's own gigs |
| GET | `/gigs/:id` | Any signed-in user | | Gig detail |
| POST | `/gigs` | Freelancer | Owner from token | Create a gig |
| PUT, PATCH | `/gigs/:id` | Freelancer | Owner only | Update a gig |
| DELETE | `/gigs/:id` | Freelancer, admin | Owner, or admin | Deactivate a gig |
| POST | `/bookings` | Client (rate limited) | | Book a gig; creates a booking and a transaction |
| GET | `/bookings/mine` | Client, freelancer | Own bookings | Bookings made, or bookings on the freelancer's gigs |
| GET | `/bookings/:id` | Client, freelancer | Participant only | Booking detail |
| GET | `/transactions/mine` | Client, freelancer | Participant only | The user's own transactions |
| GET | `/transactions` | Admin | | All transactions, paged |
| GET | `/income/me` | Freelancer | Self | Total, count, and breakdown by gig and by month |
| GET | `/admin/users` | Admin | | All users, without password hashes, paged |

Typical failures: 400 validation or malformed id, 401 missing or invalid token, 403 wrong role, 404 not found or not yours, 409 duplicate email, 429 rate limit.

## Testing

There are three layers.

| Layer | Covers | How to run |
|---|---|---|
| Security check | 68 checks on validation, sanitisation, JWT, RBAC, rate limits and headers | `cd api` then `npm run security:check` |
| API tests (Postman and Newman) | 108 requests in 8 folders: accounts, JWT, RBAC denials, validation and injection, gigs, bookings and transactions, income, rate limiting | `powershell -ExecutionPolicy Bypass -File .\docs\newman\full-evidence-run.ps1` |
| Frontend tests (Vitest and React Testing Library) | 20 tests: rendering, interaction, route guards, form rules | `cd client` then `npm test` |

### What the API tests prove

- Registration and login work for each role; duplicates, bad input and an attempted admin registration are refused; an unknown email and a wrong password give the same reply.
- Missing, malformed, unsigned and wrongly signed tokens are all rejected.
- Each role can do only its own actions, and users cannot reach other users' gigs, bookings or transactions.
- Operator payloads such as `{"$gt": ""}` and script tags are refused or neutralised, and malformed ids return 400.
- A booking creates a transaction naming both users, the price comes from the stored gig, and the freelancer's income follows the transactions.
- Repeated failed logins and a booking flood end in 429 with a `Retry-After` header, and another user is not blocked.

### Results

- **Newman:** two runs from fresh databases on MongoDB, each with 126 requests and 335 assertions and 0 failed. The collection holds 108 requests; Newman counts more because two rate-limit loops send repeats. Evidence: [CLI output](docs/newman/newman-cli-final.txt) and [HTML report](docs/newman/newman-report-final.html).
- **Vitest:** 3 files, 20 tests passed. Evidence: [output](docs/frontend-tests/vitest-output.txt).

The collection is in [docs/postman](docs/postman). The full procedure, including how to run it in the Postman app and what to do when a run fails, is in [docs/testing.md](docs/testing.md) and [docs/postman-guide.md](docs/postman-guide.md). Failed logins lock an address for the rest of the minute, so restart the API and use a fresh database between Newman runs.

## Screenshots

Part 1 response captures are in `docs/screenshots/`. Part 2 screenshots are in `docs/screenshots/part2/`.

<!-- PART 2 SCREENSHOTS: remove this comment line and the closing marker line below once the images are committed in docs/screenshots/part2/

<details>
<summary>API tests (Postman, Newman, Vitest)</summary>

![API running over HTTPS](docs/screenshots/part2/01-api-running.png)
![Security check, 68 passed](docs/screenshots/part2/02-security-check.png)
![Postman collection folders](docs/screenshots/part2/03-postman-collection.png)
![Collection Runner summary](docs/screenshots/part2/04-runner-summary.png)
![Login returns a token](docs/screenshots/part2/05-login-token.png)
![Freelancer creates a gig](docs/screenshots/part2/06-gig-created.png)
![Booking creates a transaction](docs/screenshots/part2/07-booking-transaction.png)
![Transaction linked to client and freelancer](docs/screenshots/part2/08-transaction-linked.png)
![Freelancer income](docs/screenshots/part2/09-income.png)
![Client creating a gig is refused, 403](docs/screenshots/part2/10-rbac-403.png)
![Another freelancer's gig answers 404](docs/screenshots/part2/11-ownership-404.png)
![NoSQL operator payload refused, 400](docs/screenshots/part2/12-nosql-400.png)
![Rate limit, 429 with Retry-After](docs/screenshots/part2/13-rate-limit-429.png)
![Newman CLI summary](docs/screenshots/part2/14-newman-cli.png)
![Newman HTML report](docs/screenshots/part2/15-newman-html.png)
![Vitest output](docs/screenshots/part2/16-vitest.png)
</details>

<details>
<summary>The application</summary>

![Register with a validation error](docs/screenshots/part2/17-register-validation.png)
![Login](docs/screenshots/part2/18-login.png)
![Browse gigs](docs/screenshots/part2/19-browse-gigs.png)
![Booking a gig](docs/screenshots/part2/20-book-gig.png)
![A freelancer's gigs](docs/screenshots/part2/21-my-gigs.png)
![Client bookings](docs/screenshots/part2/22-bookings-client.png)
![Freelancer bookings](docs/screenshots/part2/23-bookings-freelancer.png)
![Transactions](docs/screenshots/part2/24-transactions.png)
![Income summary](docs/screenshots/part2/25-income.png)
![Admin](docs/screenshots/part2/26-admin.png)
</details>

END OF PART 2 SCREENSHOTS -->

## Demonstration

- **Part 1 video:** https://youtu.be/t7T_t2zLuTA (API over HTTPS, registration, login with a token, and an authenticated profile call)
- **Part 2 video:** 

## Known Limitations

- **Rate limits live in memory** and are counted per process, so they reset when the API restarts and would need a shared store if the API ran on several servers.
- **Non-owned resources answer 404, not 403**, so a caller cannot tell a gig or booking they do not own from one that does not exist.
- **Payment is simulated.** A booking returns a payment reference and always completes.
- **Standalone MongoDB** cannot run multi-document transactions, so a compensating delete is used for a booking and its transaction. A replica set or Atlas uses a real transaction.
- **The client is served by the Vite dev server.** Serving a built client from the API, containers and CI/CD belong to Part 3, as do tax estimation, the full income dashboard and logging.

## Team

| Role | Responsibility | Member |
|---|---|---|
| Role 1 | Backend and API: models, gigs, bookings, transactions, income | Ethan - ST10444972) |
| Role 2 | Security: RBAC, validation, sanitisation, rate limiting, Helmet and CSP | (add member) |
| Role 3 | Frontend and documentation: React client, architecture diagram, README | (add member) |
| Role 4 | Testing and submission: Postman and Newman, frontend tests, evidence, video | Neville-ST10404539 |

