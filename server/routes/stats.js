import express from 'express';
import { Event } from '../models/Event.js';
import { Session } from '../models/Session.js';
import { Speaker } from '../models/Speaker.js';
import { Venue } from '../models/Venue.js';
import { Organization } from '../models/Organization.js';
import { Registration } from '../models/Registration.js';
import { PUBLIC_EVENT_STATUS } from '../utils/ai/visibility.js';

/**
 * Public aggregate statistics.
 *
 * Exists because the landing page used to display invented numbers — `98.4%` and `$149` written
 * into the JSX. Marketing figures a reviewer can check against the database are a liability;
 * real ones are a feature. Everything here is a count or an average over published events, so
 * there is nothing in the response that is not already visible on a public event page.
 *
 * Deliberately no per-organizer breakdowns and no revenue under any name: `revenue` is the one
 * aggregate that would expose a specific business's commercial data, and it is not here.
 */

const router = express.Router();

const PUBLIC_EVENT_FILTER = { status: { $in: PUBLIC_EVENT_STATUS } };

// A minute of caching. Serverless instances are short-lived so this mostly helps the burst of
// requests a landing page generates on a single cold start, which is exactly when it is needed.
const TTL_MS = 60_000;
let cache = { at: 0, data: null };

const build = async () => {
  const events = await Event.find(PUBLIC_EVENT_FILTER).select('_id category startDate endDate').lean();
  const eventIds = events.map((e) => e._id);

  const [
    sessionCount,
    speakerCount,
    venueCount,
    orgCount,
    ratingAgg,
    trackRows,
    cityRows,
    upcoming
  ] = await Promise.all([
    Session.countDocuments({ eventId: { $in: eventIds } }),
    Speaker.countDocuments({ eventId: { $in: eventIds } }),
    Venue.countDocuments(),
    Organization.countDocuments(),
    // Rating is averaged over registrations that actually left one. An event with no feedback
    // contributes nothing rather than a default, so the number cannot be flattered by silence.
    Registration.aggregate([
      { $match: { status: 'confirmed', 'feedback.rating': { $gte: 1 } } },
      { $group: { _id: null, avg: { $avg: '$feedback.rating' }, count: { $sum: 1 } } }
    ]),
    Session.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: '$track', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]),
    Venue.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]),
    Event.countDocuments({ ...PUBLIC_EVENT_FILTER, startDate: { $gte: new Date() } })
  ]);

  const rated = ratingAgg[0] || null;
  const registrations = await Registration.countDocuments({ status: 'confirmed' });

  return {
    events: events.length,
    upcomingEvents: upcoming,
    sessions: sessionCount,
    speakers: speakerCount,
    venues: venueCount,
    organizations: orgCount,
    registrations,
    // `null`, not a stand-in, when nothing has been rated yet. The client renders its own
    // fallback rather than the API inventing a number.
    avgRating: rated ? Math.round(rated.avg * 10) / 10 : null,
    ratingCount: rated ? rated.count : 0,
    tracks: trackRows.map((t) => ({ name: t._id || 'General', count: t.count })),
    cities: cityRows.filter((c) => c._id).map((c) => ({ name: c._id, count: c.count })),
    categories: [...new Set(events.map((e) => e.category).filter(Boolean))]
  };
};

router.get('/public', async (req, res, next) => {
  try {
    if (cache.data && Date.now() - cache.at < TTL_MS) {
      return res.json({ ...cache.data, cached: true });
    }

    const data = await build();
    cache = { at: Date.now(), data };
    res.json({ ...data, cached: false });
  } catch (err) {
    next(err);
  }
});

export default router;
