import express from 'express';
import { Organization } from '../models/Organization.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/organizations
router.get('/', protect, async (req, res, next) => {
  try {
    let orgs;
    if (req.user.globalRole === 'admin') {
      orgs = await Organization.find().populate('ownerId', 'fullName email');
    } else {
      orgs = await Organization.find({
        $or: [
          { ownerId: req.user._id },
          { 'members.userId': req.user._id }
        ]
      }).populate('ownerId', 'fullName email');
    }
    res.json(orgs);
  } catch (err) {
    next(err);
  }
});

// POST /api/organizations
router.post('/', protect, async (req, res, next) => {
  try {
    const { name, website, logo } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const org = await Organization.create({
      name,
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      website: website || '',
      logo: logo || '',
      ownerId: req.user._id,
      members: [{ userId: req.user._id, role: 'admin' }]
    });

    res.status(201).json(org);
  } catch (err) {
    next(err);
  }
});

export default router;
