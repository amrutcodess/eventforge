// Load environment variables first. This must be a side-effect import placed before the
// route modules below: ESM evaluates imports in order, and modules such as
// utils/aiService.js read process.env at module scope.
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import orgRoutes from './routes/orgs.js';
import venueRoutes from './routes/venues.js';
import eventRoutes from './routes/events.js';
import ticketRoutes from './routes/tickets.js';
import registrationRoutes from './routes/registrations.js';
import speakerRoutes from './routes/speakers.js';
import sessionRoutes from './routes/sessions.js';
import sponsorRoutes from './routes/sponsors.js';
import announcementRoutes from './routes/announcements.js';
import aiRoutes from './routes/ai.js';
import analyticsRoutes from './routes/analytics.js';
import uploadRoutes from './routes/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads Static Serving (Local File Storage). Mirrors the destination chosen in
// routes/upload.js: /tmp on serverless, server/uploads in development.
app.use(
  '/uploads',
  express.static(process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads'))
);

// Health check — deliberately registered before the database middleware so that
// connectivity can be diagnosed even when the database is unreachable. It attempts a
// connection rather than only reading the current state: on a serverless cold start
// nothing has connected yet, so a state-only check would report "disconnected" even
// when the database is perfectly healthy.
app.get('/api/health', async (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  let databaseError = null;
  try {
    await connectDB();
  } catch (err) {
    databaseError = err.message;
  }
  res.json({
    status: 'healthy',
    platform: 'EventForge API v1.0',
    database: states[mongoose.connection.readyState] || 'unknown',
    ...(databaseError ? { databaseError } : {}),
    time: new Date()
  });
});

// Ensure the database is connected before handling any request. On serverless the
// module scope is reused across warm invocations, so connectDB() resolves from the
// cached connection after the first call.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/venues', venueRoutes);
// Speaker/sponsor routers are also mounted at their own top-level prefix so the
// signed-in user's own records are reachable at /api/speakers/me and /api/sponsors/me.
app.use('/api/speakers', speakerRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/events', ticketRoutes);
app.use('/api/events', registrationRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/events', speakerRoutes);
app.use('/api/events', sessionRoutes);
app.use('/api/events', sponsorRoutes);
app.use('/api/events', announcementRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/events', analyticsRoutes);
app.use('/api/upload', uploadRoutes);

// Error Handling Middleware
app.use(errorHandler);

export default app;
