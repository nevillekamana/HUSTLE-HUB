//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const mongoose = require('mongoose');
const { Transaction } = require('../models/transactionModel');

//-----------------------------------------------------\\
//                  INCOME AGGREGATION
//-----------------------------------------------------\\

//completed payments only, grouped by gig and by month, a freelancer with
//nothing yet gets zeros back rather than a 404
const getIncome = async (freelancerId) => {
  //an aggregation pipeline does not auto cast a string id the way find()
  //does, an uncast string here would silently match nothing and every
  //freelancer would read as having earned zero
  const freelancer = new mongoose.Types.ObjectId(freelancerId);

  const [result] = await Transaction.aggregate([
    { $match: { freelancer, status: 'completed' } },
    {
      $facet: {
        total: [{ $group: { _id: null, totalCents: { $sum: '$amountCents' }, count: { $sum: 1 } } }],
        byGig: [
          { $group: { _id: '$gig', totalCents: { $sum: '$amountCents' }, count: { $sum: 1 } } },
          { $lookup: { from: 'gigs', localField: '_id', foreignField: '_id', as: 'gig' } },
          {
            $project: {
              _id: 0,
              gigId: '$_id',
              title: { $ifNull: [{ $arrayElemAt: ['$gig.title', 0] }, 'Removed gig'] },
              totalCents: 1,
              count: 1
            }
          },
          { $sort: { totalCents: -1 } }
        ],
        byMonth: [
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              totalCents: { $sum: '$amountCents' },
              count: { $sum: 1 }
            }
          },
          { $project: { _id: 0, month: '$_id', totalCents: 1, count: 1 } },
          { $sort: { month: 1 } }
        ]
      }
    }
  ]);

  const totals = result.total[0] || { totalCents: 0, count: 0 };

  return {
    currency: 'ZAR',
    totalCents: totals.totalCents,
    transactionCount: totals.count,
    byGig: result.byGig,
    byMonth: result.byMonth
  };
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = { getIncome };
