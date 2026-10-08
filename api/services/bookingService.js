//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const mongoose = require('mongoose');
const { Gig } = require('../models/gigModel');
const { Booking } = require('../models/bookingModel');
const { Transaction } = require('../models/transactionModel');
const { simulatePayment } = require('./paymentService');
const { supportsTransactions } = require('../config/db');

//-----------------------------------------------------\\
//                     ERROR CODES
//-----------------------------------------------------\\

//thrown rather than answered directly, so this stays a plain function the
//controller calls and maps to a response, the same shape as the
//EMAIL_TAKEN pattern in models/userModel.js
const GIG_NOT_FOUND = 'GIG_NOT_FOUND';
const OWN_GIG = 'OWN_GIG';

const fail = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

//-----------------------------------------------------\\
//                   CREATE A BOOKING
//-----------------------------------------------------\\

//price and freelancer always come from the stored gig, never from the
//caller, validateBookingCreate has already refused a body that carries
//anything but a gig id
const createBooking = async ({ gigId, clientId }) => {
  const gig = await Gig.findOne({ _id: gigId, isActive: true, deletedAt: null });

  if (!gig) {
    throw fail(GIG_NOT_FOUND, 'gig not found');
  }

  if (String(gig.freelancer) === clientId) {
    throw fail(OWN_GIG, 'you cannot book your own gig');
  }

  const payment = await simulatePayment({ amountCents: gig.priceCents });

  const bookingFields = {
    gig: gig._id,
    client: clientId,
    freelancer: gig.freelancer,
    priceCents: gig.priceCents,
    gigTitle: gig.title,
    status: 'confirmed'
  };

  const transactionFields = (booking) => ({
    booking: booking._id,
    gig: gig._id,
    client: clientId,
    freelancer: gig.freelancer,
    amountCents: gig.priceCents,
    reference: payment.reference
  });

  //a replica set (atlas, or a local instance started with --replSet) can run
  //a real multi document transaction, a lone standalone instance cannot,
  //config/db.js decides this once at startup
  if (supportsTransactions()) {
    const session = await mongoose.startSession();
    let booking;
    let transaction;

    try {
      await session.withTransaction(async () => {
        [booking] = await Booking.create([bookingFields], { session });
        [transaction] = await Transaction.create([transactionFields(booking)], { session });
      });
    } finally {
      await session.endSession();
    }

    return { booking, transaction };
  }

  //no replica set, no transaction, a compensating rollback closes the gap
  //instead: if writing the transaction fails, the booking it would have
  //belonged to is removed rather than left stranded with no payment record
  const booking = await Booking.create(bookingFields);

  try {
    const transaction = await Transaction.create(transactionFields(booking));
    return { booking, transaction };
  } catch (error) {
    await Booking.deleteOne({ _id: booking._id });
    throw error;
  }
};

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = { createBooking, GIG_NOT_FOUND, OWN_GIG };
