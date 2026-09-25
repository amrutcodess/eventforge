import express from 'express';
import { Speaker } from '../models/Speaker.js';
import { protect } from '../middleware/auth.js';
import { requireEventRole } from '../middleware/eventAuth.js';

const router = express.Router();

// GET /api/events/:eventId/speakers
router.get('/:eventId/speakers', async (req, res, next) => {
  try {
    const speakers = await Speaker.find({ eventId: req.params.eventId }).populate('userId', 'email avatar');
    res.json(speakers);
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:eventId/speakers (Organizer)
router.post('/:eventId/speakers', protect, requireEventRole(['organizer']), async (req, res, next) => {
  try {
    const { name, title, company, bio, photoUrl, topicTags, socialLinks, availability, userId } = req.body;
    const speaker = await Speaker.create({
      eventId: req.params.eventId,
      userId: userId || null,
      name,
      title: title || '',
      company: company || '',
      bio: bio || '',
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      topicTags: topicTags || [],
      socialLinks: socialLinks || {},
      availability: availability || []
    });
    res.status(201).json(speaker);
  } catch (err) {
    next(err);
  }
});

// PUT /api/events/:eventId/speakers/:id
router.put('/:eventId/speakers/:id', protect, requireEventRole(['organizer', 'speaker']), async (req, res, next) => {
  try {
    const updated = await Speaker.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
