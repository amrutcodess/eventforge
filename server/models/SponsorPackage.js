import mongoose from 'mongoose';

const sponsorPackageSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  name: { type: String, required: true, trim: true },
  tier: { type: String, enum: ['platinum', 'gold', 'silver', 'bronze', 'custom'], required: true },
  price: { type: Number, required: true, min: 0 },
  benefits: [{ type: String }],
  maxSponsors: { type: Number, default: 5 }
}, { timestamps: true });

export const SponsorPackage = mongoose.model('SponsorPackage', sponsorPackageSchema);
