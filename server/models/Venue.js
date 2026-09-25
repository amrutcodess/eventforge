import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  layout: { type: String, default: 'Theater' }, // Theater, Classroom, Banquet, Workshop
  equipment: [{ type: String }]
});

const venueSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, default: '' },
  city: { type: String, required: true, index: true },
  country: { type: String, default: 'USA' },
  rooms: [roomSchema]
}, { timestamps: true });

export const Venue = mongoose.model('Venue', venueSchema);
