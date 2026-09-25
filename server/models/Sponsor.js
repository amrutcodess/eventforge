import mongoose from 'mongoose';

const deliverableSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'submitted', 'approved', 'rejected'], default: 'pending' },
  dueDate: { type: Date },
  fileUrl: { type: String, default: '' }
});

const sponsorSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'SponsorPackage', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organizationName: { type: String, required: true, trim: true },
  logo: { type: String, default: '' },
  website: { type: String, default: '' },
  contactPerson: {
    name: { type: String, default: '' },
    email: { type: String, default: '' }
  },
  deliverables: [deliverableSchema]
}, { timestamps: true });

export const Sponsor = mongoose.model('Sponsor', sponsorSchema);
