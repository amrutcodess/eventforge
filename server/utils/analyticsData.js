import { Types } from 'mongoose';
import { Registration } from '../models/Registration.js';
import { Session } from '../models/Session.js';
import { Attendance } from '../models/Attendance.js';
import { TicketCategory } from '../models/TicketCategory.js';
import { Event } from '../models/Event.js';

/**
 * The data contract for the Insights feature.
 *
 * This is deliberately richer than what `routes/analytics.js` returns: the insight rules need
 * per-session attendance, room capacities and ticket sell-through side by side, whereas the
 * dashboard endpoints each answer one question in a chart-ready shape. Rather than bend one
 * to fit the other, insights loads its own view.
 *
 * One thing it does NOT share with `analytics.js`: the `avgFeedbackRating` there falls back
 * to a hardcoded `4.8` when no attendee has rated anything, so the dashboard shows a
 * flattering number for an event with zero feedback. `avgRating` here is `null` in that case,
 * because a rule engine reading an invented 4.8 would generate an "everything is fine"
 * insight that is simply false.
 */

export async function loadInsightsData(eventId) {
  const event = await Event.findById(eventId).populate('venueId').lean();
  if (!event) return null;

  const oid = new Types.ObjectId(String(eventId));

  const [sessions, tickets, registrations, attendance, timeline] = await Promise.all([
    Session.find({ eventId }).sort({ startTime: 1 }).lean(),
    TicketCategory.find({ eventId }).sort({ price: -1 }).lean(),
    Registration.find({ eventId })
      .select('status checkedIn amountPaid ticketCategoryId createdAt feedback.rating')
      .lean(),
    Attendance.aggregate([
      { $match: { eventId: oid } },
      { $group: { _id: '$sessionId', count: { $sum: 1 } } }
    ]),
    Registration.aggregate([
      { $match: { eventId: oid } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  const attendanceBySession = new Map(attendance.map((a) => [String(a._id), a.count]));

  const byStatus = registrations.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const rated = registrations.filter((r) => Number.isFinite(r.feedback?.rating));
  const avgRating = rated.length
    ? Math.round((rated.reduce((s, r) => s + r.feedback.rating, 0) / rated.length) * 10) / 10
    : null;

  const revenue = registrations
    .filter((r) => r.status === 'confirmed')
    .reduce((sum, r) => sum + (r.amountPaid || 0), 0);

  const perTicket = tickets.map((t) => {
    const confirmed = registrations.filter(
      (r) => r.status === 'confirmed' && String(r.ticketCategoryId) === String(t._id)
    ).length;
    return {
      id: String(t._id),
      name: t.name,
      price: t.price,
      capacity: t.capacity,
      quantitySold: t.quantitySold || 0,
      confirmedCount: confirmed,
      requiresApproval: Boolean(t.requiresApproval),
      revenue: confirmed * (t.price || 0)
    };
  });

  return {
    event,
    sessions: sessions.map((s) => ({
      id: String(s._id),
      title: s.title,
      track: s.track || 'General',
      roomName: s.roomName,
      startTime: s.startTime,
      endTime: s.endTime,
      capacity: s.capacity,
      attendance: attendanceBySession.get(String(s._id)) || 0
    })),
    tickets: perTicket,
    rooms: (event.venueId?.rooms || []).map((r) => ({ name: r.name, capacity: r.capacity })),
    registrations: {
      total: registrations.length,
      confirmed: byStatus.confirmed || 0,
      checkedIn: registrations.filter((r) => r.checkedIn).length,
      waitlisted: byStatus.waitlisted || 0,
      pending: byStatus.pending || 0,
      cancelled: byStatus.cancelled || 0,
      revenue,
      avgRating,
      feedbackCount: rated.length
    },
    timeline: timeline.map((t) => ({ date: t._id, registrations: t.count }))
  };
}
