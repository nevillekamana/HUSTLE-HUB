//-----------------------------------------------------\\
//                  SEED DEMO DATA
//-----------------------------------------------------\\
//run with: npm run seed:demo
//two freelancers, one client and six gigs between them, for manual testing
//and the demonstration video, refuses to run in production so nobody seeds
//placeholder accounts onto a real deployment by mistake

//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const env = require('../config/env');
const { connectDatabase, disconnectDatabase } = require('../config/db');
const { User, ROLES } = require('../models/userModel');
const { Gig } = require('../models/gigModel');
const { hashPassword } = require('../services/passwordService');

//-----------------------------------------------------\\
//                      DEMO ACCOUNTS
//-----------------------------------------------------\\

const DEMO_PASSWORD = 'Password123';

const PEOPLE = [
  { fullName: 'Fiona Freelancer', email: 'demo.freelancer1@hustlehub.test', role: ROLES.FREELANCER },
  { fullName: 'Gary Gigster', email: 'demo.freelancer2@hustlehub.test', role: ROLES.FREELANCER },
  { fullName: 'Carla Client', email: 'demo.client@hustlehub.test', role: ROLES.CLIENT }
];

const GIGS = [
  { by: 0, title: 'Logo and brand identity', description: 'Three concepts, two rounds of revisions, final files in every common format.', category: 'design', priceCents: 150000 },
  { by: 0, title: 'Landing page design', description: 'A single responsive landing page design file, ready to hand to a developer.', category: 'design', priceCents: 220000 },
  { by: 0, title: 'Blog post writing, per article', description: 'An 800 to 1200 word article on a topic of your choice, researched and edited.', category: 'writing', priceCents: 45000 },
  { by: 1, title: 'Five page marketing website', description: 'A five page responsive site built from an approved design, deployed and handed over.', category: 'development', priceCents: 500000 },
  { by: 1, title: 'React component library setup', description: 'A small reusable component library wired into an existing React project.', category: 'development', priceCents: 350000 },
  { by: 1, title: 'Social media strategy session', description: 'A ninety minute strategy session covering platform choice, posting cadence and goals.', category: 'marketing', priceCents: 80000 }
];

//-----------------------------------------------------\\
//                         SEED
//-----------------------------------------------------\\

const seed = async () => {
  if (env.nodeEnv === 'production') {
    console.error('[seed:demo] refusing to run with NODE_ENV=production');
    process.exitCode = 1;
    return;
  }

  await connectDatabase();

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  //upserted by email, so running the script again updates the same three
  //accounts and the same six gigs instead of piling up duplicates
  const users = await Promise.all(
    PEOPLE.map(async (person) => {
      await User.updateOne(
        { email: person.email },
        { $set: { fullName: person.fullName, email: person.email, passwordHash, role: person.role } },
        { upsert: true }
      );

      return User.findOne({ email: person.email });
    })
  );

  await Promise.all(
    GIGS.map((gig) =>
      Gig.findOneAndUpdate(
        { freelancer: users[gig.by]._id, title: gig.title },
        {
          $set: {
            description: gig.description,
            category: gig.category,
            priceCents: gig.priceCents,
            isActive: true,
            deletedAt: null
          }
        },
        { upsert: true }
      )
    )
  );

  console.log('[seed:demo] ready, demo accounts share the password: ' + DEMO_PASSWORD);
  users.forEach((user) => console.log('[seed:demo]   ' + user.role + ': ' + user.email));

  await disconnectDatabase();
};

seed().catch((error) => {
  console.error('[seed:demo] failed: ' + (error.name || 'Error'));
  process.exitCode = 1;
});
