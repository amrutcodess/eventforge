import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  targetAudience: { type: String, enum: ['all', 'attendees', 'speakers', 'sponsors', 'staff'], default: 'all' },
  priority: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
  sentAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const Announcement = mongoose.model('Announcement', announcementSchema);
