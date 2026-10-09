# Part 2 submission checklist

Tick each item against the running app, not against memory.

## Required by the brief
- [ ] Updated GitHub repository, 50+ commits, several contributors, clear commit messages
- [ ] README updated: features, security measures, how to run backend and frontend, testing procedure
- [ ] Backend and frontend code
- [ ] Postman collection and Newman evidence (CLI output and HTML report from the **final** run, folders 1 to 8)
- [ ] Frontend test evidence (`docs/frontend-tests/vitest-output.txt`, re-run after any UI change)
- [ ] Screenshots of the application
- [ ] Demonstration video link

## Before the final Newman run
- [ ] Role 1's routes merged (they are in the latest upload)
- [ ] Team confirms 404 (not 403) for non-owned gigs and bookings: the code returns 404 and the tests now assert it
- [ ] Admin created with `npm run seed:admin`, credentials passed with `--env-var`
- [ ] Test database, not demo data; API restarted so rate-limit counters are clear
- [ ] Run on real MongoDB or Atlas, not a stand-in, and save CLI output and HTML report to `docs/newman/`

## Screenshots worth taking
- [ ] Newman CLI summary, and the HTML report
- [ ] Vitest output
- [ ] A 403 (client creating a gig), a 400 (NoSQL payload), a 429 with `Retry-After`
- [ ] Login, browse gigs, my gigs, booking confirmation, my bookings, income

## Demo video order (from the brief)
1. Start the API and the client
2. Register and log in (show the role)
3. Freelancer creates a gig
4. Client browses and books it
5. Client and freelancer each view the booking
6. Show the transaction record and the freelancer's income
7. Optional, short: a 403 and a 429
