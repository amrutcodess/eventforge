import express from 'express';
import { Venue } from '../models/Venue.js';
import { protect, requireOrganizerOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/venues
router.get('/', async (req, res, next) => {
  try {
    const venues = await Venue.find().sort({ name: 1 });
    res.json(venues);
  } catch (err) {
    next(err);
  }
});

// GET /api/venues/:id
router.get('/:id', async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ error: 'Venue not found' });
    res.json(venue);
  } catch (err) {
    next(err);
  }
});

// POST /api/venues (Organizer / Admin)
router.post('/', protect, requireOrganizerOrAdmin, async (req, res, next) => {
  try {
    const { name, address, city, country, rooms } = req.body;
    const venue = await Venue.create({
      name,
      address: address || '',
      city,
      country: country || 'USA',
      rooms: rooms || [{ name: 'Main Auditorium', capacity: 300, layout: 'Theater' }]
    });
    res.status(201).json(venue);
  } catch (err) {
    next(err);
  }
});

// PUT /api/venues/:id (Organizer / Admin)
router.put('/:id', protect, requireOrganizerOrAdmin, async (req, res, next) => {
  try {
    const venue = await Venue.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(venue);
  } catch (err) {
    next(err);
  }
});

export default router;
