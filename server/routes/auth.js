import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  company: z.string().optional(),
  title: z.string().optional(),
  interests: z.array(z.string()).optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'eventforge_super_secret_jwt_key_2026_capstone', {
    expiresIn: '7d'
  });
};

// @route POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const existingUser = await User.findOne({ email: validatedData.email });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const user = await User.create({
      fullName: validatedData.fullName,
      email: validatedData.email,
      passwordHash: validatedData.password,
      company: validatedData.company || '',
      title: validatedData.title || '',
      interests: validatedData.interests || ['Technology', 'Leadership']
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        globalRole: user.globalRole,
        avatar: user.avatar,
        title: user.title,
        company: user.company,
        interests: user.interests
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// @route POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const user = await User.findOne({ email: validatedData.email });

    if (!user || !(await user.matchPassword(validatedData.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        globalRole: user.globalRole,
        avatar: user.avatar,
        title: user.title,
        company: user.company,
        interests: user.interests
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// @route GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      globalRole: req.user.globalRole,
      avatar: req.user.avatar,
      title: req.user.title,
      company: req.user.company,
      bio: req.user.bio,
      interests: req.user.interests
    }
  });
});

// @route PUT /api/auth/profile
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { fullName, avatar, title, company, bio, interests } = req.body;
    const user = await User.findById(req.user._id);

    if (fullName) user.fullName = fullName;
    if (avatar !== undefined) user.avatar = avatar;
    if (title !== undefined) user.title = title;
    if (company !== undefined) user.company = company;
    if (bio !== undefined) user.bio = bio;
    if (interests) user.interests = interests;

    await user.save();

    res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        globalRole: user.globalRole,
        avatar: user.avatar,
        title: user.title,
        company: user.company,
        bio: user.bio,
        interests: user.interests
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
