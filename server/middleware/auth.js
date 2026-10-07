import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'eventforge_super_secret_jwt_key_2026_capstone');
      req.user = await User.findById(decoded.id).select('-passwordHash');
      if (!req.user) {
        return res.status(401).json({ error: 'User missing or deactivated' });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ error: 'Not authorized, invalid token' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }
};

/**
 * Like `protect`, but an absent or invalid token is not an error.
 *
 * Exists for endpoints that are useful signed-out but richer signed-in — the Forge Assistant
 * being the case this was written for. It sets `req.user` when the token is good and falls
 * through silently otherwise, so downstream visibility can widen for a known caller without
 * the endpoint requiring one.
 *
 * A bad token is treated exactly like no token. It must never 401, and it must never be
 * partially trusted: a malformed JWT is not evidence of anything.
 */
export const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer')) {
    try {
      const decoded = jwt.verify(
        header.split(' ')[1],
        process.env.JWT_SECRET || 'eventforge_super_secret_jwt_key_2026_capstone'
      );
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user) req.user = user;
    } catch {
      // Deliberately silent. Anonymous is a supported state here.
    }
  }
  next();
};

export const requireGlobalAdmin = (req, res, next) => {
  if (req.user && req.user.globalRole === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied: Requires Platform Admin role' });
};

/**
 * Gate for platform-level resources (creating events and venues).
 *
 * There is deliberately no global "organizer" role in this system — organizer status is
 * scoped to an event (Event.staff) or to an organization (Organization.ownerId/members).
 * So this allows platform admins plus anyone who owns or belongs to an organization,
 * which is what actually distinguishes an organizer from a plain attendee.
 */
export const requireOrganizerOrAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.globalRole === 'admin') {
      return next();
    }

    const membership = await Organization.findOne({
      $or: [
        { ownerId: req.user._id },
        { 'members.userId': req.user._id }
      ]
    }).select('_id');

    if (membership) {
      return next();
    }

    return res.status(403).json({
      error: 'Access denied: Requires an Event Organizer account (organization owner or member)'
    });
  } catch (err) {
    next(err);
  }
};
