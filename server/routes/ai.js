import express from 'express';
import { generateAIDraft, recommendSessionsForAttendee } from '../utils/aiService.js';
import { Session } from '../models/Session.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// POST /api/ai/draft-content
router.post('/draft-content', protect, async (req, res, next) => {
  try {
    const { type, title, keywords, context } = req.body;
    if (!type || !title) {
      return res.status(400).json({ error: 'Type and Title are required' });
    }

    const draft = await generateAIDraft({ type, title, keywords, context });
    res.json({ draft });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/recommend-sessions
router.post('/recommend-sessions', protect, async (req, res, next) => {
  try {
    const { eventId, userInterests } = req.body;
    const interests = userInterests || req.user.interests || ['Technology'];

    const availableSessions = await Session.find({ eventId })
      .populate('speakerIds', 'name title company photoUrl')
      .lean();

    const recommended = await recommendSessionsForAttendee(interests, availableSessions);
    res.json({ recommended });
  } catch (err) {
    next(err);
  }
});

export default router;
