import express from 'express';
import { Announcement } from '../models/Announcement.js';
import { protect } from '../middleware/auth.js';
import { requireEventRole } from '../middleware/eventAuth.js';

const router = express.Router();

// GET /api/events/:eventId/announcements
router.get('/:eventId/announcements', async (req, res, next) => {
  try {
    const { targetAudience } = req.query;
    let query = { eventId: req.params.eventId };
    if (targetAudience) {
      query.targetAudience = { $in: ['all', targetAudience] };
    }
    const announcements = await Announcement.find(query).sort({ sentAt: -1 });
    res.json(announcements);
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:eventId/announcements (Organizer / Staff)
router.post('/:eventId/announcements', protect, requireEventRole(['organizer', 'staff']), async (req, res, next) => {
  try {
    const { title, content, targetAudience, priority } = req.body;
    const announcement = await Announcement.create({
      eventId: req.params.eventId,
      title,
      content,
      targetAudience: targetAudience || 'all',
      priority: priority || 'normal',
      sentAt: new Date()
    });
    res.status(201).json(announcement);
  } catch (err) {
    next(err);
  }
});

export default router;
