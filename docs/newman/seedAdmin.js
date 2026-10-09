// Simple admin seeder for local test runs.
// Usage: node docs/newman/seedAdmin.js --email admin@x --password Pass123 --fullName "Admin" 
const args = require('minimist')(process.argv.slice(2));
const email = args.email || args.e;
const password = args.password || args.p;
const fullName = args.fullName || args.f || 'Admin';

if (!email || !password) {
  console.error('Usage: node docs/newman/seedAdmin.js --email admin@example --password Password1 --fullName "Admin"');
  process.exit(2);
}

;(async () => {
  try {
    const path = require('path');
    const apiRoot = path.join(__dirname, '..', '..', 'api');
    const { hashPassword } = require(path.join(apiRoot, 'services', 'passwordService'));
    const { createUser, ROLES, findUserByEmail } = require(path.join(apiRoot, 'models', 'userModel'));

    // check existing
    const existing = await findUserByEmail(email);
    if (existing) {
      console.log('Admin already exists with that email:', email);
      console.log('id:', existing.id);
      process.exit(0);
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({ fullName, email, passwordHash, role: ROLES.ADMIN });
    console.log('Admin seeded:', user.id);
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed admin:', err && err.message || err);
    process.exit(1);
  }
})();
