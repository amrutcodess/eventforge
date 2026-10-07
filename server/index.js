import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

// On Vercel the app is invoked as a serverless function per request, so it must be
// exported and must never bind a port. app.js is the function entry point; this file
// is used for local development and for platforms that run a long-lived process.
if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 EventForge Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error(`Failed to start server: ${err.message}`);
      process.exit(1);
    });
}

export default app;
