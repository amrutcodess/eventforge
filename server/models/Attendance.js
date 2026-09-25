import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
  attendeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  checkedInAt: { type: Date, default: Date.now },
  method: { type: String, enum: ['qr', 'manual'], default: 'qr' }
}, { timestamps: true });

// Prevent duplicate check-in per session per attendee
attendanceSchema.index({ sessionId: 1, attendeeId: 1 }, { unique: true });

export const Attendance = mongoose.model('Attendance', attendanceSchema);
