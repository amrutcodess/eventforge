import express from 'express';
import { Session } from '../models/Session.js';
import { Attendance } from '../models/Attendance.js';
import { Registration } from '../models/Registration.js';
import { protect } from '../middleware/auth.js';
import { requireEventRole } from '../middleware/eventAuth.js';

const router = express.Router();

// GET /api/events/:eventId/sessions
router.get('/:eventId/sessions', async (req, res, next) => {
  try {
    const sessions = await Session.find({ eventId: req.params.eventId })
      .populate('speakerIds', 'name title company photoUrl topicTags')
      .sort({ startTime: 1 });
    res.json(sessions);
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:eventId/sessions (Organizer)
router.post('/:eventId/sessions', protect, requireEventRole(['organizer']), async (req, res, next) => {
  try {
    const { title, summary, description, roomName, speakerIds, track, startTime, endTime, capacity, resources } = req.body;
    const eventId = req.params.eventId;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ error: 'Session start time must be before end time' });
    }

    // AUTOMATIC ROOM/TIME CONFLICT DETECTION
    const conflictingSession = await Session.findOne({
      eventId,
      roomName,
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } }
      ]
    });

    if (conflictingSession) {
      return res.status(400).json({
        error: `Schedule Conflict: Room "${roomName}" is already booked by "${conflictingSession.title}" between ${new Date(conflictingSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} and ${new Date(conflictingSession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
      });
    }

    const session = await Session.create({
      eventId,
      title,
      summary: summary || '',
      description: description || '',
      roomName,
      speakerIds: speakerIds || [],
      track: track || 'General',
      startTime: start,
      endTime: end,
      capacity: capacity || 100,
      resources: resources || []
    });

    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
});

// PUT /api/events/:eventId/sessions/:id (Organizer)
router.put('/:eventId/sessions/:id', protect, requireEventRole(['organizer']), async (req, res, next) => {
  try {
    const { title, summary, description, roomName, speakerIds, track, startTime, endTime, capacity } = req.body;
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (startTime && endTime && roomName) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      const conflictingSession = await Session.findOne({
        _id: { $ne: req.params.id },
        eventId: req.params.eventId,
        roomName,
        $or: [
          { startTime: { $lt: end }, endTime: { $gt: start } }
        ]
      });

      if (conflictingSession) {
        return res.status(400).json({
          error: `Schedule Conflict: Room "${roomName}" is booked by "${conflictingSession.title}".`
        });
      }
    }

    const updated = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:eventId/sessions/:id
router.delete('/:eventId/sessions/:id', protect, requireEventRole(['organizer']), async (req, res, next) => {
  try {
    await Session.findByIdAndDelete(req.params.id);
    await Attendance.deleteMany({ sessionId: req.params.id });
    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:eventId/sessions/:sessionId/check-in — Session attendance QR scan
router.post('/:eventId/sessions/:sessionId/check-in', protect, requireEventRole(['organizer', 'staff']), async (req, res, next) => {
  try {
    const { attendeeId, qrToken, method } = req.body;
    let targetAttendeeId = attendeeId;

    if (qrToken) {
      const reg = await Registration.findOne({ eventId: req.params.eventId, qrCodeToken: qrToken });
      if (!reg) return res.status(404).json({ error: 'Invalid attendee QR badge token' });
      targetAttendeeId = reg.attendeeId;
    }

    if (!targetAttendeeId) return res.status(400).json({ error: 'Attendee ID or QR token required' });

    const attendance = await Attendance.create({
      eventId: req.params.eventId,
      sessionId: req.params.sessionId,
      attendeeId: targetAttendeeId,
      method: method || 'qr'
    });

    res.status(201).json({ success: true, attendance });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Attendee already checked in to this session' });
    }
    next(err);
  }
});

// GET /api/events/:eventId/sessions/:sessionId/attendance — View attendance list
router.get('/:eventId/sessions/:sessionId/attendance', protect, requireEventRole(['organizer', 'staff', 'speaker']), async (req, res, next) => {
  try {
    const attendance = await Attendance.find({ sessionId: req.params.sessionId })
      .populate('attendeeId', 'fullName email company title avatar')
      .sort({ checkedInAt: -1 });

    res.json(attendance);
  } catch (err) {
    next(err);
  }
});

export default router;
