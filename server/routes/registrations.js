import express from 'express';
import { Registration } from '../models/Registration.js';
import { TicketCategory } from '../models/TicketCategory.js';
import { CouponCode } from '../models/CouponCode.js';
import { Session } from '../models/Session.js';
import { generateQRCodeDataURI } from '../utils/qrGenerator.js';
import { protect } from '../middleware/auth.js';
import { requireEventRole } from '../middleware/eventAuth.js';

const router = express.Router();

const REGISTRATION_STATUSES = ['pending', 'approved', 'confirmed', 'cancelled', 'waitlisted'];

/**
 * Promote the earliest waitlisted registration for a ticket category once a seat frees up.
 * Called when a confirmed registration is cancelled or moved off "confirmed".
 */
const promoteFromWaitlist = async (eventId, ticketCategoryId) => {
  const ticket = await TicketCategory.findById(ticketCategoryId);
  if (!ticket || ticket.quantitySold >= ticket.capacity) return null;

  const nextInLine = await Registration.findOne({
    eventId,
    ticketCategoryId,
    status: 'waitlisted'
  }).sort({ createdAt: 1 });

  if (!nextInLine) return null;

  nextInLine.status = 'confirmed';
  await nextInLine.save();

  ticket.quantitySold += 1;
  await ticket.save();

  return nextInLine;
};

// GET /api/registrations/my-all — Logged in user's registrations across all events
router.get('/my-all', protect, async (req, res, next) => {
  try {
    const regs = await Registration.find({ attendeeId: req.user._id })
      .populate('eventId', 'title slug startDate endDate bannerImage themeColor')
      .populate('ticketCategoryId', 'name price badgeColor')
      .sort({ createdAt: -1 });

    const withQRCodes = await Promise.all(regs.map(async (reg) => {
      const qrCodeDataUri = await generateQRCodeDataURI(reg.qrCodeToken);
      return {
        ...reg.toObject(),
        qrCodeDataUri
      };
    }));

    res.json(withQRCodes);
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:eventId/registrations/my
router.get('/:eventId/registrations/my', protect, async (req, res, next) => {
  try {
    const registration = await Registration.findOne({
      eventId: req.params.eventId,
      attendeeId: req.user._id
    })
      .populate('eventId', 'title slug startDate endDate venueId')
      .populate('ticketCategoryId', 'name price badgeColor');

    if (!registration) {
      return res.status(404).json({ registered: false });
    }

    const qrCodeDataUri = await generateQRCodeDataURI(registration.qrCodeToken);

    res.json({
      registered: true,
      registration: {
        ...registration.toObject(),
        qrCodeDataUri
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:eventId/register
router.post('/:eventId/register', protect, async (req, res, next) => {
  try {
    const { ticketCategoryId, couponCode } = req.body;
    const eventId = req.params.eventId;
    const attendeeId = req.user._id;

    // Check existing registration
    const existing = await Registration.findOne({ eventId, attendeeId });
    if (existing) {
      return res.status(400).json({ error: 'You are already registered for this event' });
    }

    const ticket = await TicketCategory.findById(ticketCategoryId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket category not found' });
    }

    // Capacity & Status check
    let status = 'confirmed';
    if (ticket.quantitySold >= ticket.capacity) {
      status = 'waitlisted';
    } else if (ticket.requiresApproval) {
      status = 'pending';
    }

    // Calculate mock payment amount
    let finalAmount = ticket.price;
    if (couponCode && finalAmount > 0) {
      const coupon = await CouponCode.findOne({ eventId, code: couponCode.toUpperCase(), active: true });
      if (coupon && coupon.usedCount < coupon.maxUses) {
        if (coupon.discountType === 'percentage') {
          finalAmount = Math.max(0, finalAmount * (1 - coupon.discountValue / 100));
        } else {
          finalAmount = Math.max(0, finalAmount - coupon.discountValue);
        }
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    const orderNumber = `EF-ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const qrCodeToken = `EF-REG-${eventId.toString().slice(-4)}-${attendeeId.toString().slice(-4)}-${Date.now().toString().slice(-6)}`;

    const registration = await Registration.create({
      eventId,
      attendeeId,
      ticketCategoryId,
      orderNumber,
      status,
      amountPaid: Math.round(finalAmount * 100) / 100,
      couponCode: couponCode || '',
      qrCodeToken
    });

    if (status === 'confirmed') {
      ticket.quantitySold += 1;
      await ticket.save();
    }

    const qrCodeDataUri = await generateQRCodeDataURI(qrCodeToken);

    res.status(201).json({
      registration: {
        ...registration.toObject(),
        qrCodeDataUri
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:eventId/registrations (Organizer / Staff)
router.get('/:eventId/registrations', protect, requireEventRole(['organizer', 'staff']), async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let query = { eventId: req.params.eventId };
    if (status) query.status = status;

    const registrations = await Registration.find(query)
      .populate('attendeeId', 'fullName email avatar company title')
      .populate('ticketCategoryId', 'name price badgeColor')
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (err) {
    next(err);
  }
});

// PUT /api/events/:eventId/registrations/:id/status (Organizer / Staff)
router.put('/:eventId/registrations/:id/status', protect, requireEventRole(['organizer', 'staff']), async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!REGISTRATION_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status "${status}". Expected one of: ${REGISTRATION_STATUSES.join(', ')}`
      });
    }

    const registration = await Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ error: 'Registration not found' });

    const previousStatus = registration.status;
    registration.status = status;
    await registration.save();

    // Capacity bookkeeping: releasing a confirmed seat frees it for the waitlist.
    if (previousStatus === 'confirmed' && status !== 'confirmed') {
      await TicketCategory.updateOne(
        { _id: registration.ticketCategoryId, quantitySold: { $gt: 0 } },
        { $inc: { quantitySold: -1 } }
      );
      await promoteFromWaitlist(registration.eventId, registration.ticketCategoryId);
    }

    res.json(registration);
  } catch (err) {
    next(err);
  }
});

// PUT /api/events/:eventId/registrations/:id/check-in — Manual entrance check-in toggle (Organizer / Staff)
router.put('/:eventId/registrations/:id/check-in', protect, requireEventRole(['organizer', 'staff']), async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ error: 'Registration not found' });

    // Defaults to toggling; callers may pass an explicit target state.
    const checkedIn = req.body.checkedIn === undefined ? !registration.checkedIn : !!req.body.checkedIn;

    if (checkedIn && registration.status !== 'confirmed') {
      return res.status(400).json({
        error: `Cannot check in. Registration status is ${registration.status}`
      });
    }

    registration.checkedIn = checkedIn;
    registration.checkedInAt = checkedIn ? new Date() : undefined;
    await registration.save();

    res.json(registration);
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:eventId/check-in — Staff Scan Check-in API
router.post('/:eventId/check-in', protect, requireEventRole(['organizer', 'staff']), async (req, res, next) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken) return res.status(400).json({ error: 'QR Token is required' });

    const registration = await Registration.findOne({
      eventId: req.params.eventId,
      qrCodeToken: qrToken
    }).populate('attendeeId', 'fullName email avatar company title').populate('ticketCategoryId', 'name badgeColor');

    if (!registration) {
      return res.status(404).json({ error: 'Invalid QR Ticket Code for this event' });
    }

    if (registration.status !== 'confirmed') {
      return res.status(400).json({ error: `Cannot check-in. Registration status is ${registration.status}` });
    }

    if (registration.checkedIn) {
      return res.status(400).json({
        alreadyCheckedIn: true,
        message: 'Attendee has already been checked in!',
        registration
      });
    }

    registration.checkedIn = true;
    registration.checkedInAt = new Date();
    await registration.save();

    res.json({
      success: true,
      message: `Check-in successful for ${registration.attendeeId.fullName}`,
      registration
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:eventId/my-sessions — Sessions the current attendee has selected
router.get('/:eventId/my-sessions', protect, async (req, res, next) => {
  try {
    const registration = await Registration.findOne({
      eventId: req.params.eventId,
      attendeeId: req.user._id
    }).populate({
      path: 'attendeeSelections',
      populate: { path: 'speakerIds', select: 'name title company photoUrl' }
    });

    if (!registration) return res.status(404).json({ error: 'Registration not found' });

    res.json(registration.attendeeSelections || []);
  } catch (err) {
    next(err);
  }
});

// PUT /api/events/:eventId/my-sessions — Replace the attendee's session selection
router.put('/:eventId/my-sessions', protect, async (req, res, next) => {
  try {
    const { sessionIds } = req.body;
    if (!Array.isArray(sessionIds)) {
      return res.status(400).json({ error: 'sessionIds must be an array' });
    }

    const registration = await Registration.findOne({
      eventId: req.params.eventId,
      attendeeId: req.user._id
    });
    if (!registration) return res.status(404).json({ error: 'Registration not found' });

    // Only accept sessions that actually belong to this event.
    const validSessions = await Session.find({
      _id: { $in: sessionIds },
      eventId: req.params.eventId
    }).select('_id');

    registration.attendeeSelections = validSessions.map((s) => s._id);
    await registration.save();

    res.json(registration.attendeeSelections);
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:eventId/feedback — Attendee feedback submission
router.post('/:eventId/feedback', protect, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const registration = await Registration.findOne({
      eventId: req.params.eventId,
      attendeeId: req.user._id
    });

    if (!registration) return res.status(404).json({ error: 'Registration not found' });

    registration.feedback = {
      rating,
      comment: comment || '',
      submittedAt: new Date()
    };
    await registration.save();

    res.json({ success: true, feedback: registration.feedback });
  } catch (err) {
    next(err);
  }
});

export default router;
