import express from 'express';
import { TicketCategory } from '../models/TicketCategory.js';
import { CouponCode } from '../models/CouponCode.js';
import { protect } from '../middleware/auth.js';
import { requireEventRole } from '../middleware/eventAuth.js';

const router = express.Router();

// GET /api/events/:eventId/tickets
router.get('/:eventId/tickets', async (req, res, next) => {
  try {
    const tickets = await TicketCategory.find({ eventId: req.params.eventId });
    res.json(tickets);
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:eventId/tickets (Organizer)
router.post('/:eventId/tickets', protect, requireEventRole(['organizer']), async (req, res, next) => {
  try {
    const { name, description, price, currency, capacity, salesStart, salesEnd, requiresApproval, badgeColor } = req.body;
    const ticket = await TicketCategory.create({
      eventId: req.params.eventId,
      name,
      description: description || '',
      price: price || 0,
      currency: currency || 'USD',
      capacity,
      salesStart,
      salesEnd,
      requiresApproval: !!requiresApproval,
      badgeColor: badgeColor || '#2D4A3E'
    });
    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:eventId/coupons (Organizer)
router.post('/:eventId/coupons', protect, requireEventRole(['organizer']), async (req, res, next) => {
  try {
    const { code, discountType, discountValue, maxUses, validUntil } = req.body;
    const coupon = await CouponCode.create({
      eventId: req.params.eventId,
      code,
      discountType,
      discountValue,
      maxUses: maxUses || 100,
      validUntil
    });
    res.status(201).json(coupon);
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:eventId/coupons/validate — Public validation
router.post('/:eventId/coupons/validate', async (req, res, next) => {
  try {
    const { code } = req.body;
    const coupon = await CouponCode.findOne({
      eventId: req.params.eventId,
      code: code.toUpperCase(),
      active: true
    });

    if (!coupon) {
      return res.status(404).json({ error: 'Invalid or inactive coupon code' });
    }

    if (coupon.validUntil && new Date() > new Date(coupon.validUntil)) {
      return res.status(400).json({ error: 'Coupon code has expired' });
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ error: 'Coupon code max usage limit reached' });
    }

    res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    });
  } catch (err) {
    next(err);
  }
});

export default router;
