import mongoose from 'mongoose';

const ticketCategorySchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  capacity: { type: Number, required: true, min: 1 },
  quantitySold: { type: Number, default: 0 },
  salesStart: { type: Date },
  salesEnd: { type: Date },
  requiresApproval: { type: Boolean, default: false },
  badgeColor: { type: String, default: '#2D4A3E' }
}, { timestamps: true });

export const TicketCategory = mongoose.model('TicketCategory', ticketCategorySchema);
