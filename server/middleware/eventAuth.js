import { Event } from '../models/Event.js';
import { Speaker } from '../models/Speaker.js';
import { Sponsor } from '../models/Sponsor.js';
import { Registration } from '../models/Registration.js';

export const getEventPermissions = async (userId, eventId) => {
  if (!userId || !eventId) {
    return { role: null, canManage: false, canStaff: false, isSpeaker: false, isSponsor: false, isAttendee: false };
  }

  const event = await Event.findById(eventId);
  if (!event) {
    return { role: null, canManage: false, canStaff: false, isSpeaker: false, isSponsor: false, isAttendee: false };
  }

  const userIdStr = userId.toString();

  // 1. Staff check on Event document
  const staffMember = event.staff.find(s => s.userId.toString() === userIdStr);
  const staffRole = staffMember ? staffMember.role : null; // 'organizer' | 'staff'

  // 2. Speaker check
  const speakerRecord = await Speaker.findOne({ eventId, userId });

  // 3. Sponsor check
  const sponsorRecord = await Sponsor.findOne({ eventId, userId });

  // 4. Attendee registration check
  const registrationRecord = await Registration.findOne({ eventId, attendeeId: userId, status: 'confirmed' });

  const canManage = staffRole === 'organizer';
  const canStaff = staffRole === 'organizer' || staffRole === 'staff';

  return {
    event,
    staffRole,
    canManage,
    canStaff,
    isSpeaker: !!speakerRecord,
    isSponsor: !!sponsorRecord,
    isAttendee: !!registrationRecord,
    speakerId: speakerRecord ? speakerRecord._id : null,
    sponsorId: sponsorRecord ? sponsorRecord._id : null,
    registrationId: registrationRecord ? registrationRecord._id : null
  };
};

export const requireEventRole = (allowedRoles = ['organizer', 'staff']) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Platform Admin bypasses event-level restrictions
      if (req.user.globalRole === 'admin') {
        req.eventPermissions = {
          canManage: true,
          canStaff: true,
          staffRole: 'organizer',
          isAdmin: true
        };
        return next();
      }

      const eventId = req.params.eventId || req.params.id || req.body.eventId;
      if (!eventId) {
        return res.status(400).json({ error: 'Event ID parameter missing' });
      }

      const permissions = await getEventPermissions(req.user._id, eventId);
      
      let authorized = false;
      if (allowedRoles.includes('organizer') && permissions.canManage) authorized = true;
      if (allowedRoles.includes('staff') && permissions.canStaff) authorized = true;
      if (allowedRoles.includes('speaker') && permissions.isSpeaker) authorized = true;
      if (allowedRoles.includes('sponsor') && permissions.isSponsor) authorized = true;
      if (allowedRoles.includes('attendee') && permissions.isAttendee) authorized = true;

      if (!authorized) {
        return res.status(403).json({ error: `Insufficient permissions for this event. Required role(s): ${allowedRoles.join(', ')}` });
      }

      req.eventPermissions = permissions;
      next();
    } catch (err) {
      next(err);
    }
  };
};
