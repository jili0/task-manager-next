// src/lib/db.ts
import mongoose from "mongoose";

// Define a type alias for the connection cache
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Extend the global namespace for TypeScript
declare global {
  var mongoose: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

// Initialize cache
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

// If cache doesn't exist yet, create it
if (!global.mongoose) {
  global.mongoose = cached;
}

const dbConnect = async () => {
  if (cached.conn) {
    console.log("MongoDB: Using existing connection");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    console.log("MongoDB: Establishing connection...");
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("MongoDB: Connection successfully established");
        return mongoose;
      })
      .catch((err) => {
        console.error("MongoDB Connection error:", err);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("MongoDB: Connection failed", e);
    throw e;
  }

  return cached.conn;
};

export default dbConnect;