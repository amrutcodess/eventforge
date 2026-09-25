import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

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

export const requireGlobalAdmin = (req, res, next) => {
  if (req.user && req.user.globalRole === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied: Requires Platform Admin role' });
};
