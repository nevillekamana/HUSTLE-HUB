# Backend API contract

Base URL: `/api`. All successful responses use `{ success: true, message, data }`; failures use `{ success: false, message, errors: [] }`. Monetary values are integer South African rand cents (`currency: "ZAR"`). Protected endpoints require `Authorization: Bearer <JWT>`.

## Income and tax

- `GET /income/me` — freelancer token. Returns `data.income` with `currency`, `totalCents`, `transactionCount`, `byGig`, and `byMonth`.
- `GET /income/tax` — freelancer token. Optional query `taxYear=2026` or `taxYear=2027`. Without a year, the service selects the current supported SARS table or the nearest available supported table. Returns `data.tax` with `taxYear`, `taxYearLabel`, `grossIncomeCents`, `taxableIncomeCents`, `taxBeforeRebatesCents`, `primaryRebateCents`, `estimatedTaxCents`, `netIncomeCents`, `brackets`, `transactionCount`, `periodStart`, `periodEnd`, `availableTaxYears`, `isCurrentTaxYear`, `assumptions`, and `disclaimer`.

Tax assumptions: completed transaction income is treated as taxable freelance business income; expenses/deductions and age-based rebates are not stored or applied; the estimate is not professional tax advice.

## Audit logs

- `GET /admin/audit-logs` — administrator token only. Optional query parameters: `page` (default 1), `limit` (default 20, maximum 100), `action`, and `outcome` (`success`, `failure`, or `denied`). Returns `data.entries`, `page`, `limit`, and `total`. Audit entries are append-only and cannot be changed or deleted through the model or API.

## Authentication and lockout

- `POST /auth/register` — public; existing registration body and validation are unchanged.
- `POST /auth/login` — public; existing body and response are unchanged for ordinary success/failure. Three failed attempts for the same normalized email lock that account for 15 minutes by default. A lock returns `429`, `Retry-After`, and an account-specific error without disclosing whether the email exists. `LOCKOUT_MAX_FAILURES` and `LOCKOUT_DURATION_MS` configure the behavior; the IP login limiter remains an additional control.
- `GET /auth/profile` — authenticated user token.

All responses include `X-Request-Id`. Logs are JSON structured and redact password, token, authorization, secret, hash, credential, and connection-string values.

## Local backend configuration

Required for a real run: `MONGO_URI` and a stable `JWT_SECRET` (required outside development). Relevant optional values: `LOCKOUT_MAX_FAILURES`, `LOCKOUT_DURATION_MS`, `RATE_LIMIT_LOGIN_MAX`, `RATE_LIMIT_LOGIN_WINDOW_MS`, `LOG_LEVEL`, and the existing rate-limit variables. Never commit `.env` or secrets.

## Verification commands

```powershell
cd api
npm test
npm run security:check
npm audit --omit=dev
```

Full Newman execution requires an isolated MongoDB database, a running API, seeded administrator credentials, and the existing collection at `docs/postman/HustleHub.part2.postman_collection.json`. The current checkout does not contain a lockout collection, and historical Newman output must not be treated as a current execution result.
