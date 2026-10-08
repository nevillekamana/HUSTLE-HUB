//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const mongoose = require('mongoose');

//-----------------------------------------------------\\
//                        SCHEMA
//-----------------------------------------------------\\

const bookingSchema = new mongoose.Schema(
  {
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    //both are copied from the gig at the moment of booking rather than read
    //through the reference every time, so a booking still shows what it was
    //actually booked for after the gig's own price or title changes later
    priceCents: { type: Number, required: true },
    gigTitle: { type: String, required: true },
    //cancellation is out of scope for part 2, there is no route that sets
    //this to 'cancelled' yet, the value exists so adding one later is not a
    //schema migration
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' }
  },
  { timestamps: true }
);

const Booking = mongoose.model('Booking', bookingSchema);

//-----------------------------------------------------\\
//                   PUBLIC SERIALISER
//-----------------------------------------------------\\

//the create reply carries plain ids (populated = false), a list or detail
//reply populates gig, client and freelancer into the same shallow shapes
//gigController and userModel already use elsewhere
const toPublicBooking = (booking, populated) => ({
  id: booking.id,
  gig: populated
    ? { id: booking.gig.id, title: booking.gig.title, category: booking.gig.category }
    : String(booking.gig),
  client: populated ? { id: booking.client.id, fullName: booking.client.fullName } : String(booking.client),
  freelancer: populated
    ? { id: booking.freelancer.id, fullName: booking.freelancer.fullName }
    : String(booking.freelancer),
  priceCents: booking.priceCents,
  gigTitle: booking.gigTitle,
  status: booking.status,
  createdAt: booking.createdAt
});

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = { Booking, toPublicBooking };
