import mongoose from 'mongoose';

const couponCodeSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  code: { type: String, required: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ['percentage', 'flat'], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  maxUses: { type: Number, default: 100 },
  usedCount: { type: Number, default: 0 },
  validUntil: { type: Date },
  active: { type: Boolean, default: true }
}, { timestamps: true });

couponCodeSchema.index({ eventId: 1, code: 1 }, { unique: true });

export const CouponCode = mongoose.model('CouponCode', couponCodeSchema);
