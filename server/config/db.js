import mongoose from 'mongoose';

let mongoMemoryServer = null;
let connectionPromise = null;

const isProduction = () => process.env.NODE_ENV === 'production';

// Only a locally-hosted MongoDB may ever fall back to the in-memory server. A remote
// URI (Atlas) that happens to be slow or unreachable must fail loudly instead — the
// in-memory substitute accepts every write and then discards it.
const isLocalUri = (uri = '') => /(^|@|\/\/)(127\.0\.0\.1|localhost|\[::1\])(:|\/|$)/.test(uri);

/**
 * Establish (and cache) the MongoDB connection.
 *
 * On serverless platforms the module scope survives across warm invocations, so the
 * connection promise is cached and reused. Without this, every request opens a new
 * connection and exhausts the Atlas connection pool.
 */
export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    const uri = process.env.MONGODB_URI;

    if (uri) {
      try {
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: isLocalUri(uri) ? 3000 : 8000
        });
        console.log(`MongoDB Connected: ${mongoose.connection.host}`);
        return mongoose.connection;
      } catch (err) {
        // Clear the cached promise so a later request can retry the connection.
        connectionPromise = null;

        if (isProduction() || !isLocalUri(uri)) {
          throw new Error(
            `Could not connect to MongoDB at MONGODB_URI: ${err.message}`
          );
        }
        console.warn(`Local MongoDB unreachable (${err.message}). Falling back to in-memory MongoDB...`);
      }
    } else if (isProduction()) {
      connectionPromise = null;
      // Never degrade to an in-memory database in production: it "works" but silently
      // discards every write, which is far worse than failing loudly.
      throw new Error(
        'MONGODB_URI is not set. Configure it in your environment (e.g. a MongoDB Atlas connection string).'
      );
    }

    try {
      // Imported lazily so the serverless bundle never loads this package: it exists
      // only for the development fallback below, and it pulls down a MongoDB binary.
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const mongoUri = mongoMemoryServer.getUri();
      await mongoose.connect(mongoUri);
      console.log(`In-Memory MongoDB Server connected at ${mongoUri} (development only — data is not persisted)`);
      return mongoose.connection;
    } catch (memErr) {
      connectionPromise = null;
      throw new Error(`Could not connect to any MongoDB instance: ${memErr.message}`);
    }
  })();

  return connectionPromise;
};
