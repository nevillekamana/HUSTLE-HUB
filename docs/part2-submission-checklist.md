# Part 2 submission checklist (Role 4)

This file collects the submission artifacts and what must be verified before final PR.

- [ ] Repo contains Postman collection and environment under `docs/postman/` (HustleHub.part2.postman_collection.json, HustleHub.local.postman_environment.json)
- [ ] Newman CLI output and HTML report in `docs/newman/`
- [ ] Frontend test output in `docs/frontend-tests/`
- [ ] `docs/testing.md` contains exact run commands and notes
- [ ] `docs/part2-submission-checklist.md` and `docs/testing.md` updated with observed pass/fail counts
- [ ] Screenshots: Newman summary, Newman HTML, Vitest verbose output, example 400 NoSQL payload, example 403, example 429 with Retry-After
- [ ] Demo video recorded following the brief sequence

Before final PR
- Ensure branch `role4/testing` contains only Role 4 files and test files under `client/src`.
- Do not push secrets or `.env` files.
