//-----------------------------------------------------\\
//                SEAM — ROLE 1 REPLACES THIS
//-----------------------------------------------------\\
//demo data for the mock server only, the real records come from mongo once
//the part 2 routes are live and this folder can be deleted

//-----------------------------------------------------\\
//                     DEMO ACCOUNTS
//-----------------------------------------------------\\

//every demo account shares one password that passes the register rules,
//the mock stores only a hash of it
const DEMO_PASSWORD = 'Password123';

//ids are 24 hex characters like a mongo objectid, so the client's handling of
//an invalid id is exercised exactly as it will be against the real api
const oid = (kind, n) => kind + String(n).padStart(22, '0');

const USERS = [
  ['Lerato Dlamini', 'lerato@example.co.za', 'client', '2026-09-02'],
  ['Thandi Mokoena', 'thandi@example.co.za', 'freelancer', '2026-08-11'],
  ['Sipho Ndlovu', 'sipho@example.co.za', 'freelancer', '2026-08-14'],
  ['Ayesha Patel', 'ayesha@example.co.za', 'freelancer', '2026-08-20'],
  ['Pieter van Wyk', 'pieter@example.co.za', 'freelancer', '2026-08-22'],
  ['Naledi Khumalo', 'naledi@example.co.za', 'freelancer', '2026-08-25'],
  ['Johan Botha', 'johan@example.co.za', 'freelancer', '2026-09-01'],
  ['Kagiso Mahlangu', 'kagiso@example.co.za', 'client', '2026-08-18'],
  ['Platform Admin', 'admin@hustlehub.co.za', 'admin', '2026-08-01']
];

//-----------------------------------------------------\\
//                       DEMO GIGS
//-----------------------------------------------------\\

//[owner number, title, description, category, price in cents, active, listed]
const GIGS = [
  [2, 'Logo design', 'Three concepts and two rounds of revisions. Final files in SVG and PNG.', 'design', 150000, true, '2026-09-08'],
  [3, 'WordPress site fixes', 'Speed, security patches and a backup plan for an existing site.', 'development', 280000, true, '2026-09-01'],
  [4, 'Matric maths tutoring', 'Four one-hour online sessions following the CAPS curriculum.', 'tutoring', 90000, true, '2026-09-03'],
  [5, 'Product copy for an online store', 'Twenty product descriptions written for search.', 'writing', 125000, true, '2026-09-21'],
  [6, 'Instagram launch campaign', 'A two-week content calendar and twelve designed posts.', 'marketing', 340000, true, '2026-09-20'],
  [7, 'CV and LinkedIn rewrite', 'A recruiter-ready CV and profile within 48 hours.', 'writing', 65000, true, '2026-09-19'],
  [2, 'Brand style guide', 'A twelve-page guide covering logo use, colour, type and tone of voice.', 'design', 150000, true, '2026-08-15'],
  [3, 'Landing page build', 'A fast one-page site with a contact form and basic analytics.', 'development', 450000, true, '2026-09-17'],
  [4, 'Physical sciences exam prep', 'Three sessions working through Grade 12 past papers.', 'tutoring', 75000, true, '2026-09-16'],
  [6, 'Google Business profile setup', 'Profile, photos and replies to your first ten reviews.', 'marketing', 80000, true, '2026-09-15'],
  [5, 'Afrikaans to English translation', 'Up to 2 000 words, returned within three working days.', 'writing', 60000, true, '2026-09-14'],
  [7, 'Spreadsheet clean-up', 'Tidy formulas, fix errors and add a one-page summary sheet.', 'other', 55000, true, '2026-09-12'],
  [2, 'Wedding invitation suite', 'Invitation, RSVP card and menu, ready for print.', 'design', 120000, false, '2026-08-30'],
  [6, 'Event photo editing', 'Colour correction and light retouching for up to 50 photos.', 'other', 95000, true, '2026-09-10']
];

//-----------------------------------------------------\\
//                 DEMO BOOKINGS AND PAYMENTS
//-----------------------------------------------------\\

//[gig number, client number, booked on, payment reference]
const BOOKINGS = [
  [1, 1, '2026-09-12', 'SIM-7F3K9Q2M4X'],
  [1, 8, '2026-09-20', 'SIM-2HD8QW4K7P'],
  [7, 8, '2026-08-28', 'SIM-9XK3M2LQ8D'],
  [3, 1, '2026-09-15', 'SIM-4TR7N2P9WA'],
  [2, 1, '2026-09-05', 'SIM-6BQ2K8Z3VM']
];

//-----------------------------------------------------\\
//                     BUILD THE SEED
//-----------------------------------------------------\\

const at = (day, hour) => day + 'T' + String(hour).padStart(2, '0') + ':00:00.000Z';

//a fresh copy every time, so resetting the mock can never inherit a mutation
const buildSeed = () => {
  const users = USERS.map(([fullName, email, role, joined], index) => ({
    id: oid('a1', index + 1),
    fullName,
    email,
    role,
    createdAt: at(joined, 8)
  }));

  const gigs = GIGS.map(([owner, title, description, category, priceCents, isActive, listed], index) => ({
    id: oid('b2', index + 1),
    freelancer: oid('a1', owner),
    title,
    description,
    category,
    priceCents,
    isActive,
    deletedAt: null,
    createdAt: at(listed, 9),
    updatedAt: at(listed, 9)
  }));

  const bookings = [];
  const transactions = [];

  BOOKINGS.forEach(([gigNumber, clientNumber, day, reference], index) => {
    const gig = gigs[gigNumber - 1];
    const booking = {
      id: oid('c3', index + 1),
      gig: gig.id,
      client: oid('a1', clientNumber),
      freelancer: gig.freelancer,
      priceCents: gig.priceCents,
      gigTitle: gig.title,
      status: 'confirmed',
      createdAt: at(day, 10)
    };

    bookings.push(booking);
    transactions.push({
      id: oid('d4', index + 1),
      booking: booking.id,
      gig: gig.id,
      client: booking.client,
      freelancer: booking.freelancer,
      amountCents: booking.priceCents,
      currency: 'ZAR',
      status: 'completed',
      reference,
      createdAt: booking.createdAt
    });
  });

  return { users, gigs, bookings, transactions };
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

export { DEMO_PASSWORD, buildSeed };
