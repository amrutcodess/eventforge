import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  fileType: { type: String, default: 'pdf' }
});

const sessionSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  title: { type: String, required: true, trim: true },
  summary: { type: String, default: '' },
  description: { type: String, default: '' },
  roomName: { type: String, required: true },
  speakerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Speaker' }],
  track: { type: String, default: 'General' },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date, required: true },
  capacity: { type: Number, default: 100 },
  resources: [resourceSchema]
}, { timestamps: true });

export const Session = mongoose.model('Session', sessionSchema);
