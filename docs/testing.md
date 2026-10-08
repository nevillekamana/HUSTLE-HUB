# Testing and Newman instructions (Role 4)

This document describes how to run the Role 4 test suite (Newman collection) and frontend tests (Vitest).

Prerequisites
- Node.js 16+ and npm
- A local MongoDB instance for test runs. Example connection string: `mongodb://127.0.0.1:27017/hustlehub_test`
- Newman (see commands below)

Newman collection and environment
- Collection: `docs/postman/HustleHub.part2.postman_collection.json`
- Environment: `docs/postman/HustleHub.local.postman_environment.json`

Seed admin
Use the provided script from the API package. Example PowerShell (Role 4 expects a throwaway admin):

~~~powershell
$env:ADMIN_EMAIL = 'admin@example.test'
$env:ADMIN_PASSWORD = 'Password1'
$env:ADMIN_FULL_NAME = 'Admin Test'
cd api
npm run seed:admin
~~~

Run the API (restart before each Newman run)
Set `MONGO_URI` to a fresh test database. Example PowerShell:

~~~powershell
$env:MONGO_URI = 'mongodb://127.0.0.1:27017/hustlehub_test'
cd api
npm start
~~~

Run Newman (from repo root)

~~~powershell
# A convenience script validates collection scripts first, then runs newman and produces an HTML report.
# Arguments: -collection, -environment, -baseUrl, -adminEmail, -adminPassword
pwsh ./docs/newman/run.ps1 -collection docs/postman/HustleHub.part2.postman_collection.json -environment docs/postman/HustleHub.local.postman_environment.json -baseUrl "https://localhost:5000/api" -adminEmail "admin@example.test" -adminPassword "Password1"

# Or the raw newman command:
# npx newman run docs/postman/HustleHub.part2.postman_collection.json -e docs/postman/HustleHub.local.postman_environment.json --env-var baseUrl="https://localhost:5000/api" --env-var adminEmail="admin@example.test" --env-var adminPassword="Password1" --reporters cli,htmlextra --insecure --color off
~~~

Notes and caveats
- Restart the API before each run and use a fresh database; failed-login rate limits persist per IP and can block subsequent logins.
- The collection registers four users per run; the registration rate limit is 30 per 15 minutes — do not run many concurrent jobs against the same IP.
- The collection must be run against a real MongoDB. If you cannot start MongoDB locally, Role 4 documents a FerretDB fallback (not committed here) but it has known limitations (income aggregation may fail).

Evidence
- Save the CLI output and the HTML report into `docs/newman/` and commit them as evidence.

Frontend tests
- Run from `client/`:

~~~powershell
cd client
npm install
npx vitest run --reporter=verbose > ../docs/frontend-tests/vitest-output.txt
~~~

See `docs/part2-submission-checklist.md` for screenshots and the ordered demo sequence.
