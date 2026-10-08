//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

const mongoose = require('mongoose');
const { GIG_CATEGORIES } = require('../middleware/resourceValidation');

//-----------------------------------------------------\\
//                        SCHEMA
//-----------------------------------------------------\\

const gigSchema = new mongoose.Schema(
  {
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    category: { type: String, required: true, enum: GIG_CATEGORIES },
    priceCents: { type: Number, required: true, min: 100, max: 10000000 },
    //a gig is never hard deleted, a booking or a transaction can still point
    //at it, so isActive and deletedAt are what browse and detail check
    //instead of the record disappearing
    isActive: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

gigSchema.index({ isActive: 1, category: 1, createdAt: -1 });

const Gig = mongoose.model('Gig', gigSchema);

//-----------------------------------------------------\\
//                   PUBLIC SERIALISER
//-----------------------------------------------------\\

//an allowlist in the style of toPublicUser. freelancer is expected to already
//be populated with just fullName, the same shallow shape every list and
//detail response uses, never a full user record
const toPublicGig = (gig) => ({
  id: gig.id,
  title: gig.title,
  description: gig.description,
  category: gig.category,
  priceCents: gig.priceCents,
  isActive: gig.isActive,
  freelancer: gig.freelancer
    ? { id: gig.freelancer.id, fullName: gig.freelancer.fullName }
    : { id: null, fullName: 'Former member' },
  createdAt: gig.createdAt,
  updatedAt: gig.updatedAt
});

//-----------------------------------------------------\\
//                        EXPORTS
//-----------------------------------------------------\\

module.exports = { Gig, toPublicGig };
