import mongoose from 'mongoose';

const speakerSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true, trim: true },
  title: { type: String, default: '' },
  company: { type: String, default: '' },
  bio: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  topicTags: [{ type: String }],
  socialLinks: {
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    website: { type: String, default: '' }
  },
  availability: [{
    date: { type: Date },
    startTime: { type: String },
    endTime: { type: String }
  }]
}, { timestamps: true });

export const Speaker = mongoose.model('Speaker', speakerSchema);
