//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const mongoose = require('mongoose');

//-----------------------------------------------------\\
//                        SCHEMA
//-----------------------------------------------------\\

const transactionSchema = new mongoose.Schema(
  {
    //one booking produces exactly one transaction, the unique index is what
    //the booking service's rollback on a partial failure relies on never
    //actually being needed twice for the same booking
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    //denormalised off the booking so income can group by gig without a
    //second lookup chain through it
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amountCents: { type: Number, required: true },
    currency: { type: String, default: 'ZAR' },
    //refunds are out of scope for part 2, the same reasoning as a
    //booking's 'cancelled' status
    status: { type: String, enum: ['completed', 'refunded'], default: 'completed' },
    reference: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

transactionSchema.index({ freelancer: 1, status: 1, createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

//-----------------------------------------------------\\
//                   PUBLIC SERIALISER
//-----------------------------------------------------\\

//booking stays a plain id either way, nothing currently needs it populated
const toPublicTransaction = (transaction, populated) => ({
  id: transaction.id,
  booking: String(transaction.booking),
  gig: populated
    ? { id: transaction.gig.id, title: transaction.gig.title, category: transaction.gig.category }
    : String(transaction.gig),
  client: populated
    ? { id: transaction.client.id, fullName: transaction.client.fullName }
    : String(transaction.client),
  freelancer: populated
    ? { id: transaction.freelancer.id, fullName: transaction.freelancer.fullName }
    : String(transaction.freelancer),
  amountCents: transaction.amountCents,
  currency: transaction.currency,
  status: transaction.status,
  reference: transaction.reference,
  createdAt: transaction.createdAt
});

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = { Transaction, toPublicTransaction };
