import express from 'express';
import { Sponsor } from '../models/Sponsor.js';
import { SponsorPackage } from '../models/SponsorPackage.js';
import { protect } from '../middleware/auth.js';
import { requireEventRole } from '../middleware/eventAuth.js';

const router = express.Router();

// GET /api/sponsors/me — The signed-in sponsor's sponsorships, packages and deliverables
router.get('/me', protect, async (req, res, next) => {
  try {
    const sponsorships = await Sponsor.find({ userId: req.user._id })
      .populate('packageId')
      .populate('eventId', 'title slug startDate endDate bannerImage themeColor');

    res.json(sponsorships);
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:eventId/sponsors
router.get('/:eventId/sponsors', async (req, res, next) => {
  try {
    const sponsors = await Sponsor.find({ eventId: req.params.eventId }).populate('packageId');
    res.json(sponsors);
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:eventId/sponsor-packages
router.get('/:eventId/sponsor-packages', async (req, res, next) => {
  try {
    const packages = await SponsorPackage.find({ eventId: req.params.eventId });
    res.json(packages);
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:eventId/sponsor-packages (Organizer)
router.post('/:eventId/sponsor-packages', protect, requireEventRole(['organizer']), async (req, res, next) => {
  try {
    const { name, tier, price, benefits, maxSponsors } = req.body;
    const pkg = await SponsorPackage.create({
      eventId: req.params.eventId,
      name,
      tier,
      price,
      benefits: benefits || [],
      maxSponsors: maxSponsors || 5
    });
    res.status(201).json(pkg);
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:eventId/sponsors (Organizer)
router.post('/:eventId/sponsors', protect, requireEventRole(['organizer']), async (req, res, next) => {
  try {
    const { packageId, organizationName, logo, website, contactPerson, deliverables, userId } = req.body;
    const sponsor = await Sponsor.create({
      eventId: req.params.eventId,
      packageId,
      userId: userId || null,
      organizationName,
      logo: logo || '',
      website: website || '',
      contactPerson: contactPerson || {},
      deliverables: deliverables || [
        { title: 'Vector Brand Logo (SVG/EPS)', description: 'For keynote screen and backdrop printing', dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000) },
        { title: 'Promo Video (15s MP4)', description: 'For main stage intermission screen loop', dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000) },
        { title: 'Exhibition Booth Banner', description: 'Print dimensions: 80x200cm', dueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000) }
      ]
    });
    res.status(201).json(sponsor);
  } catch (err) {
    next(err);
  }
});

// PUT /api/events/:eventId/sponsors/:id/deliverables/:deliverableId — Deliverables status update
router.put('/:eventId/sponsors/:id/deliverables/:deliverableId', protect, requireEventRole(['organizer', 'sponsor']), async (req, res, next) => {
  try {
    const { status, fileUrl } = req.body;
    const sponsor = await Sponsor.findById(req.params.id);
    if (!sponsor) return res.status(404).json({ error: 'Sponsor not found' });

    const deliverable = sponsor.deliverables.id(req.params.deliverableId);
    if (!deliverable) return res.status(404).json({ error: 'Deliverable not found' });

    if (status) deliverable.status = status;
    if (fileUrl !== undefined) deliverable.fileUrl = fileUrl;

    await sponsor.save();
    res.json(sponsor);
  } catch (err) {
    next(err);
  }
});

export default router;
