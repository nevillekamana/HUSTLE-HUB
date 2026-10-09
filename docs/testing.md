# Testing

Role 4 (Testing and Submission Lead). Three layers: the security check (Role 2), the Postman collection run with Newman (backend), and Vitest with React Testing Library (frontend).

## Backend: Postman and Newman

The collection is `docs/postman/HustleHub.part2.postman_collection.json`, with `HustleHub.local.postman_environment.json` beside it. Every request asserts the status code and the response envelope, and most check that nothing internal leaks (stack traces, `passwordHash`). The success cases check the exact fields returned, not just the status.

| Folder | What it proves |
| --- | --- |
| 1. Health | The API is up |
| 2. Accounts and login | Register and log in as client, freelancer and admin; duplicate email (409), missing fields, weak password, bad email, admin self-registration refused; a wrong password and an unknown email give the same 401 |
| 3. JWT on protected routes | Missing, malformed, unsigned (`alg: none`) and wrongly signed tokens are all 401 |
| 4. RBAC denials | A client creating a gig, a freelancer or admin booking, a client reading income, non-admins on `/transactions` and `/admin/*`: all 403 |
| 5. Validation and malicious input | Missing and out-of-range fields, bad ids, a caller setting the owner, price or freelancer, `$gt`, `$ne` and `$where` payloads, `<script>` text: all refused or neutralised |
| 6. Gigs | Create, browse, page, filter, update, delete; the owner comes from the token; stored text has no markup; another freelancer editing or deleting a gig gets 404 and the gig is unchanged |
| 7. Bookings, transactions and income | A booking creates a transaction naming both users; the price comes from the stored gig; freelancer income equals the completed transactions; nobody sees another user's booking or transaction; admin lists; deleting a gig keeps its bookings and income |
| 8. Rate limiting | Repeated failed logins and a booking flood end in 429 with `Retry-After` and a named limit; a different user is not blocked |

### Running it

Create the admin account once (Role 1's seed script), then start the API:

~~~powershell
cd api
$env:ADMIN_EMAIL = "admin@hustlehub.test"
$env:ADMIN_PASSWORD = "<choose a password>"
$env:ADMIN_FULL_NAME = "Test Admin"
npm run seed:admin
npm start
~~~

In a second terminal, from the repo root:

~~~powershell
npm install --no-save newman newman-reporter-htmlextra
npx newman run docs/postman/HustleHub.part2.postman_collection.json `
  -e docs/postman/HustleHub.local.postman_environment.json `
  --env-var adminEmail=admin@hustlehub.test --env-var adminPassword=<the password above> `
  --insecure --reporters cli,htmlextra `
  --reporter-htmlextra-export docs/newman/newman-report.html
~~~

`--insecure` is needed because the local certificate is self-signed. Without `adminEmail` the admin checks are skipped, not failed.

Before running it again:

- Failed logins are counted per address (5 per minute) and folder 8 deliberately trips that limit. **Restart the API, or wait a minute, between runs.**
- Registrations are limited to 30 per 15 minutes per address, and each run registers four users.
- Folder 7 expects freelancer A to have exactly one booking, which holds because each run registers new users. Use a test database rather than your demo data.

### Evidence

`docs/newman/` holds the CLI output and HTML report of the final run.

## Frontend: Vitest and React Testing Library

~~~powershell
cd client
npm test
~~~

| File | Covers |
| --- | --- |
| `src/pages/Login.test.jsx` | Rendering (heading, fields, button, register link); interaction (an empty submit shows errors and makes no request, a valid submit sends the trimmed email, a failed sign in shows the API message and clears the password, a raw error is never shown) |
| `src/auth/ProtectedRoute.test.jsx` | Signed-out visitors go to login, a client is turned away from a freelancer page, a freelancer gets in |
| `src/utils/validation.test.js` | The form rules that mirror the API: sign up, login, gig fields, price range, admin role refused, field error mapping |

Output is saved in `docs/frontend-tests/vitest-output.txt`.

## Security check

~~~powershell
cd api
npm run security:check
~~~

Role 2's 68 checks, described in `docs/security.md`. They test the controls directly; the Postman collection tests the same controls the way a client sees them.
