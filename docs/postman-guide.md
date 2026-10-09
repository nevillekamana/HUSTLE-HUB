# Postman guide

How to import, run, read and maintain the HustleHub+ Part 2 collection, in the Postman app and with Newman. For what each folder proves, see `docs/testing.md`.

## Files

| File | Purpose |
| --- | --- |
| `docs/postman/HustleHub.part2.postman_collection.json` | The collection: 108 requests in 8 folders, every one with assertions |
| `docs/postman/HustleHub.local.postman_environment.json` | The environment: `baseUrl`, `adminEmail`, `adminPassword` |
| `docs/newman/` | CLI output and HTML report from the final Newman run |

The repo-root `postman/` folder belongs to Postman's own git sync. Leave it alone.

## One-time setup

1. **Start the stack.** Use a throwaway database, never demo data.

   ~~~powershell
   cd api
   $env:ADMIN_EMAIL = "admin@hustlehub.test"
   $env:ADMIN_PASSWORD = "<choose a password>"
   $env:ADMIN_FULL_NAME = "Test Admin"
   npm run seed:admin
   npm start
   ~~~

2. **Import.** In Postman choose Import and drop both JSON files from `docs/postman/`.
3. **Pick the environment.** Select *HustleHub+ local* in the top-right dropdown. Nothing resolves without it.
4. **Fill the environment.**

   | Variable | Value |
   | --- | --- |
   | `baseUrl` | `https://localhost:5000/api` (or `http://localhost:5000/api` if the API fell back to HTTP). It must end in `/api` |
   | `adminEmail` | The email you seeded |
   | `adminPassword` | The password you seeded |

   Without `adminEmail` the admin requests are skipped, not failed.
5. **Certificate.** The local certificate is self-signed. In Postman open Settings, General, and turn off *SSL certificate verification* for local testing. Turn it back on afterwards.

## Before every run

Do all four, every time. Skipping any of them is the cause of almost every confusing failure.

1. **Restart the API.** Rate-limit counters live in memory. Failed logins lock the address for the rest of the minute, and folder 8 trips that limit on purpose.
2. **Use a fresh database** (or drop the test one). Folder 7 expects freelancer A to have exactly one booking.
3. **Reset the collection variables.** Postman keeps collection variables between runs, unlike Newman. Open the collection, then the Variables tab, and clear the *current value* of `runId`, `loginBurst` and `bookingBurst`. A stale `runId` reuses the old emails and registration answers 409; stale counters skip the rate-limit loops.
4. **Check the environment is selected** and `baseUrl` ends in `/api`.

## Running it

### A. Collection Runner (whole suite)

1. Right-click the collection, choose *Run collection*.
2. Leave all folders ticked and the order unchanged. Folders depend on the ones before them: 2 creates the users and tokens, 6 creates the gig that 7 books, and 8 must be last.
3. Run. Every request should pass and nothing should be marked failed.

Do not rename, reorder or delete requests in folder 8. The two loops find themselves by name (`postman.setNextRequest`) and stop looping if the name changes.

### B. One request at a time (for screenshots and debugging)

Run folders 1 and 2 first with the Runner so the tokens and ids exist, then send single requests. Open the **Test Results** tab under the response to show the assertions.

Folder 8 needs repeated sends. The assertions only run once the counter reaches its target:

| Request | Sends needed |
| --- | --- |
| `POST /auth/login - repeated failures end in 429` | 8 |
| `POST /bookings - flood from one client ends in 429` | 12 |

To try again, clear `loginBurst` or `bookingBurst`, and restart the API for the login case.

### C. Newman (the evidence run)

~~~powershell
npm install --no-save newman newman-reporter-htmlextra
npx newman run docs/postman/HustleHub.part2.postman_collection.json `
  -e docs/postman/HustleHub.local.postman_environment.json `
  --env-var adminEmail=admin@hustlehub.test --env-var adminPassword=<password> `
  --insecure --reporters cli,htmlextra `
  --reporter-htmlextra-export docs/newman/newman-report.html
~~~

To save the console output as text, add `--color off` and redirect it:

~~~powershell
npx newman run ... --color off > docs/newman/newman-cli.txt
~~~

Newman starts every run with clean variables, so step 3 of the checklist above does not apply, but steps 1 and 2 still do.

Newman reports more executed requests than the 108 in the collection, because the two rate-limit loops send extra copies. What matters is that the *failed* column reads 0 for requests, test scripts and assertions.

## What to expect, folder by folder

| Folder | Typical statuses |
| --- | --- |
| 1. Health | 200 |
| 2. Accounts and login | 201 registers, 200 logins, then 409, 400, 400, 400, 400/403, 401, 401, 400 |
| 3. JWT | 200 for the valid token, 401 for everything else |
| 4. RBAC denials | 403 throughout |
| 5. Validation and malicious input | 400 throughout (the `<script>` search returns below 500 and does not echo the script) |
| 6. Gigs | 201, 200, then 404 for another freelancer's gig |
| 7. Bookings, transactions and income | 201 booking, 200 reads, 404 for other users' records, 404 for a deleted gig |
| 8. Rate limiting | 401s while looping, then 429 with `Retry-After` |

## Screenshots to take

Show the status code, the response body and the Test Results tab in each.

| Evidence | Request |
| --- | --- |
| Login and token | `POST /auth/login - freelancer A` |
| Gig created | `POST /gigs - freelancer A creates a gig` |
| Booking and transaction | `POST /bookings - client books the gig` |
| Transaction linked to both users | `GET /transactions/mine - client has a transaction for the booking` |
| Income | `GET /income/me - freelancer A income reflects the booking` |
| RBAC denial | `POST /gigs - client cannot create a gig (403)` |
| Ownership denial | `PUT /gigs/:id - freelancer B cannot edit A's gig (404)` |
| Injection refused | `POST /auth/login - NoSQL operators instead of strings (400)` |
| Rate limit | `POST /auth/login - repeated failures end in 429` (the 8th send) |
| Whole run | The Runner summary, the Newman CLI summary and the HTML report |

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| *Could not get any response* or a certificate error | Turn off SSL verification in Postman, use `--insecure` with Newman, or point `baseUrl` at the HTTP address |
| 404 on every request | `baseUrl` is missing `/api` |
| 401 on everything from folder 3 onwards | Folder 2 was not run, or the token expired (default one hour). Run folder 2 again |
| Every login is 429 | A previous run locked the address. Restart the API or wait a minute |
| Register answers 409 on a second run | `runId` is stale. Clear it (see *Before every run*) |
| Income assertions fail on a second run | Freelancer A already has bookings from an earlier run. Use a fresh database and a new `runId` |
| Admin requests show as skipped | `adminEmail` is empty or the wrong environment is selected |
| Admin login returns 401 | The seed script ran against a different `MONGO_URI`, or the password differs |
| `GET /income/me` returns 500 | The income query uses `$facet`, which real MongoDB and Atlas support but some compatible servers do not. Test on real MongoDB |
| Rate-limit folder never reaches 429 | Counters are stale or the limits were raised in `.env`. Clear `loginBurst` and `bookingBurst` and check the `RATE_LIMIT_*` values |
| `--no-color` is rejected by Newman | Use `--color off` |

To see what a script is doing, open the Postman Console (View, Show Postman Console).

## Changing the collection

1. **Follow the route policy.** A new route needs a row in `api/config/routePolicy.js` first. Add its RBAC denial to folder 4 and its bad input to folder 5.
2. **Every request asserts** the status, the response envelope (`success`, `message`, `errors` on failures) and that nothing internal leaks. Success cases assert the exact fields returned.
3. **Be strict.** Never loosen an assertion to make a run pass. A failing test caused by the app is a bug to report to the owning role.
4. **Keep scripts apostrophe-safe.** Do not put an apostrophe inside a single-quoted string in a test script. It broke a script once and silently dropped its assertions.
5. **Respect the order.** Anything that fails logins or floods an endpoint belongs in folder 8.
6. **Export and commit.** Export the collection as v2.1 and overwrite the file in `docs/postman/`. Read the diff, because Postman reorders keys and can add noise. Never export an environment that contains real credentials.
7. **Re-run Newman** twice from fresh restarts and refresh the evidence in `docs/newman/`.

## Do and do not

- Do restart the API and reset the variables before each run.
- Do keep `adminPassword` as a secret-type variable and out of git.
- Do not run the suite against demo or real data.
- Do not run folder 8 before the rest.
- Do not commit exported environments with credentials in them.
