import express from 'express';
import { User } from '../models/User.js';
import { protect, requireGlobalAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users (Admin only)
router.get('/', protect, requireGlobalAdmin, async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id/role (Admin only)
router.put('/:id/role', protect, requireGlobalAdmin, async (req, res, next) => {
  try {
    const { globalRole } = req.body;
    if (!['admin', 'user'].includes(globalRole)) {
      return res.status(400).json({ error: 'Invalid globalRole' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { globalRole }, { new: true }).select('-passwordHash');
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
