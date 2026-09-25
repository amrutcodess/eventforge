import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  attendeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  ticketCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketCategory', required: true },
  orderNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'approved', 'confirmed', 'cancelled', 'waitlisted'], default: 'confirmed', index: true },
  amountPaid: { type: Number, default: 0 },
  couponCode: { type: String, default: '' },
  quantity: { type: Number, default: 1, min: 1 },
  guestNames: [{
    name: { type: String, default: '' },
    email: { type: String, default: '' }
  }],
  qrCodeToken: { type: String, required: true, unique: true },
  checkedIn: { type: Boolean, default: false },
  checkedInAt: { type: Date },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, default: '' },
    submittedAt: { type: Date }
  }
}, { timestamps: true });

// Enforce 1 primary registration order per user per event
registrationSchema.index({ eventId: 1, attendeeId: 1 }, { unique: true });

export const Registration = mongoose.model('Registration', registrationSchema);
