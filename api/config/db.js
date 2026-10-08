//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const mongoose = require('mongoose');
const env = require('./env');

//-----------------------------------------------------\\
//                    CONFIGURATION
//-----------------------------------------------------\\

//an unknown field silently matching nothing is a bug, not a query that just
//happens to return zero results, so a filter must name real schema paths
mongoose.set('strictQuery', true);

//a second line of defence behind the hand written sanitiser in
//middleware/sanitizeMiddleware.js, a key that still reaches a query wrapped
//in '$eq' instead of being read as an operator
mongoose.set('sanitizeFilter', true);

//set once connectDatabase has checked what the server actually is, booking
//creation reads this to decide whether to use a multi document transaction
let transactionsSupported = false;

const supportsTransactions = () => transactionsSupported;

//-----------------------------------------------------\\
//                      CONNECTION
//-----------------------------------------------------\\

//a replica set (atlas, or a local instance started with --replSet) can run a
//multi document transaction, a lone standalone instance cannot, the booking
//flow falls back to a compensating rollback when this is false
const detectTransactionSupport = async () => {
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  return Boolean(hello.setName);
};

const connectDatabase = async () => {
  //failure must never reach a log with the uri still attached, it carries a
  //password for an atlas cluster
  try {
    await mongoose.connect(env.mongoUri);
  } catch (error) {
    console.error('[db] connection failed (' + (error.name || 'Error') + ')');
    throw error;
  }

  transactionsSupported = await detectTransactionSupport();
  console.log(
    '[db] connected' + (transactionsSupported ? ', replica set detected' : ', standalone instance detected')
  );
};

const disconnectDatabase = async () => mongoose.disconnect();

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = {
  connectDatabase,
  disconnectDatabase,
  supportsTransactions
};
