import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  venueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  tagline: { type: String, default: '' },
  description: { type: String, default: '' },
  bannerImage: { type: String, default: '' },
  category: { type: String, enum: ['conference', 'workshop', 'exhibition', 'summit'], default: 'conference' },
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['draft', 'published', 'ongoing', 'completed', 'archived'], default: 'draft', index: true },
  staff: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['organizer', 'staff'], default: 'staff' }
  }],
  themeColor: { type: String, default: '#2D4A3E' },
  tags: [{ type: String }]
}, { timestamps: true });

export const Event = mongoose.model('Event', eventSchema);
