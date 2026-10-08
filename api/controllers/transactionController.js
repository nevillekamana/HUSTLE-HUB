//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const httpStatus = require('../utils/httpStatus');
const { sendSuccess } = require('../utils/apiResponse');
const { Transaction, toPublicTransaction } = require('../models/transactionModel');

//-----------------------------------------------------\\
//                        HELPERS
//-----------------------------------------------------\\

const populateTransaction = (query) =>
  query.populate('gig', 'title category').populate('client', 'fullName').populate('freelancer', 'fullName');

//-----------------------------------------------------\\
//                         LISTING
//-----------------------------------------------------\\

//only a client or a freelancer who is actually a party to the transaction,
//the same participant pattern bookingController uses, admin is not on this
//route in config/routePolicy.js, it has the full list below instead
const listMine = async (req, res) => {
  const transactions = await populateTransaction(
    Transaction.find({ $or: [{ client: req.auth.id }, { freelancer: req.auth.id }] }).sort({ createdAt: -1 })
  );

  return sendSuccess(res, httpStatus.OK, 'transactions retrieved', {
    transactions: transactions.map((transaction) => toPublicTransaction(transaction, true))
  });
};

//admin only, every transaction on the platform, req.paging already comes
//from validatePaging on this row of config/routePolicy.js
const listAll = async (req, res) => {
  const { page, limit, skip } = req.paging;

  const [transactions, total] = await Promise.all([
    populateTransaction(Transaction.find().sort({ createdAt: -1 }).skip(skip).limit(limit)),
    Transaction.countDocuments()
  ]);

  return sendSuccess(res, httpStatus.OK, 'transactions retrieved', {
    transactions: transactions.map((transaction) => toPublicTransaction(transaction, true)),
    page,
    limit,
    total
  });
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = { listMine, listAll };
