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

//sanitizeFilter is deliberately left off: it rewrites every '$' operator in
//every query, including ones a controller builds itself such as
//{ priceCents: { $gte: minPrice } } for a price range, which it cannot tell
//apart from one supplied by a caller and breaks by trying to cast the whole
//operator object as a plain value. the real defence against an operator
//arriving from outside is middleware/sanitizeMiddleware.js, which refuses a
//'$' prefixed key in the body or the query string before any route runs,
//and the field by field validators in middleware/resourceValidation.js,
//which only ever accept a plain number or a plain string for a filter value

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
