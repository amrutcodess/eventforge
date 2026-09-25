import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads Static Serving (Local File Storage)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/events', ticketRoutes);
app.use('/api/events', registrationRoutes);
app.use('/api/registrations', registrationRoutes); // for /my-all
app.use('/api/events', speakerRoutes);
app.use('/api/events', sessionRoutes);
app.use('/api/events', sponsorRoutes);
app.use('/api/events', announcementRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/events', analyticsRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', platform: 'EventForge API v1.0', time: new Date() });
});

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect Database & Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 EventForge Server running on http://localhost:${PORT}`);
  });
});
