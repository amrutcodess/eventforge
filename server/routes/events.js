import express from 'express';
import jwt from 'jsonwebtoken';
import { Event } from '../models/Event.js';
import { Venue } from '../models/Venue.js';
import { TicketCategory } from '../models/TicketCategory.js';
import { Speaker } from '../models/Speaker.js';
import { Session } from '../models/Session.js';
import { Sponsor } from '../models/Sponsor.js';
import { SponsorPackage } from '../models/SponsorPackage.js';
import { protect, requireOrganizerOrAdmin } from '../middleware/auth.js';
import { requireEventRole, getEventPermissions } from '../middleware/eventAuth.js';

const router = express.Router();

// GET /api/events — Public listing (Published events)
router.get('/', async (req, res, next) => {
  try {
    const { category, search } = req.query;
    let query = { status: { $in: ['published', 'ongoing'] } };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tagline: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const events = await Event.find(query)
      .populate('venueId', 'name city country')
      .populate('orgId', 'name logo')
      .sort({ startDate: 1 })
      .lean();

    // `minPrice`, `sessionCount` and the ticket tiers are attached here because the marketing
    // pages need them and used to invent them (a hardcoded "$149" on the featured-event cards).
    // Two grouped aggregates rather than a query per event, and every value is a real number
    // straight from the ticket tiers and the programme. The tiers are carried whole — name,
    // price, description — so the landing page's pass section prices a real event instead of
    // inventing SaaS tiers.
    const ids = events.map((e) => e._id);
    const [priceRows, sessionRows] = await Promise.all([
      TicketCategory.aggregate([
        { $match: { eventId: { $in: ids } } },
        { $sort: { price: 1 } },
        {
          $group: {
            _id: '$eventId',
            minPrice: { $min: '$price' },
            ticketCount: { $sum: 1 },
            categories: {
              $push: {
                name: '$name',
                price: '$price',
                description: '$description',
                capacity: '$capacity'
              }
            }
          }
        }
      ]),
      Session.aggregate([
        { $match: { eventId: { $in: ids } } },
        { $group: { _id: '$eventId', sessionCount: { $sum: 1 } } }
      ])
    ]);

    const prices = new Map(priceRows.map((r) => [String(r._id), r]));
    const sessionCounts = new Map(sessionRows.map((r) => [String(r._id), r.sessionCount]));

    res.json(
      events.map((e) => {
        const pricing = prices.get(String(e._id));
        return {
          ...e,
          minPrice: pricing ? pricing.minPrice : null,
          ticketCount: pricing ? pricing.ticketCount : 0,
          ticketCategories: pricing ? pricing.categories : [],
          sessionCount: sessionCounts.get(String(e._id)) || 0
        };
      })
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/events/manage/all — Managed events for logged-in user
router.get('/manage/all', protect, async (req, res, next) => {
  try {
    let events;
    if (req.user.globalRole === 'admin') {
      events = await Event.find()
        .populate('venueId', 'name city')
        .populate('orgId', 'name')
        .sort({ startDate: -1 });
    } else {
      events = await Event.find({
        'staff.userId': req.user._id
      })
        .populate('venueId', 'name city')
        .populate('orgId', 'name')
        .sort({ startDate: -1 });
    }
    res.json(events);
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:slugOrId — Public/Detail lookup
router.get('/:slugOrId', async (req, res, next) => {
  try {
    const { slugOrId } = req.params;
    let event;

    if (slugOrId.match(/^[0-9a-fA-F]{24}$/)) {
      event = await Event.findById(slugOrId)
        .populate('venueId')
        .populate('orgId', 'name logo website')
        .populate('staff.userId', 'fullName email avatar title company');
    } else {
      event = await Event.findOne({ slug: slugOrId })
        .populate('venueId')
        .populate('orgId', 'name logo website')
        .populate('staff.userId', 'fullName email avatar title company');
    }

    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Fetch relational components
    const tickets = await TicketCategory.find({ eventId: event._id });
    const speakers = await Speaker.find({ eventId: event._id });
    const sessions = await Session.find({ eventId: event._id }).populate('speakerIds', 'name title company photoUrl');
    const sponsors = await Sponsor.find({ eventId: event._id }).populate('packageId');
    const packages = await SponsorPackage.find({ eventId: event._id });

    // Check user permissions if token passed
    let userPermissions = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'eventforge_super_secret_jwt_key_2026_capstone');
        userPermissions = await getEventPermissions(decoded.id, event._id);
      } catch (e) {
        // ignore token errors for public view
      }
    }

    res.json({
      event,
      tickets,
      speakers,
      sessions,
      sponsors,
      packages,
      userPermissions
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/events — Create Event (Organizer / Admin)
router.post('/', protect, requireOrganizerOrAdmin, async (req, res, next) => {
  try {
    const { orgId, venueId, title, tagline, description, bannerImage, category, startDate, endDate, themeColor, tags } = req.body;
    
    const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

    const event = await Event.create({
      orgId,
      venueId,
      title,
      slug,
      tagline: tagline || '',
      description: description || '',
      bannerImage: bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      category: category || 'conference',
      startDate,
      endDate,
      status: 'draft',
      staff: [{ userId: req.user._id, role: 'organizer' }],
      themeColor: themeColor || '#2D4A3E',
      tags: tags || ['Conference']
    });

    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});

// PUT /api/events/:id — Update Event
router.put('/:id', protect, requireEventRole(['organizer']), async (req, res, next) => {
  try {
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:id/staff — Manage Staff
router.post('/:id/staff', protect, requireEventRole(['organizer']), async (req, res, next) => {
  try {
    const { userId, role } = req.body; // role: 'organizer' | 'staff'
    const event = await Event.findById(req.params.id);
    
    const existingIndex = event.staff.findIndex(s => s.userId.toString() === userId);
    if (existingIndex >= 0) {
      event.staff[existingIndex].role = role;
    } else {
      event.staff.push({ userId, role });
    }
    await event.save();
    res.json(event);
  } catch (err) {
    next(err);
  }
});

export default router;
