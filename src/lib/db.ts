import mongoose from "mongoose";

// Definiere einen Typalias für den Connection-Cache
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Erweitern des globalen Namespace für TypeScript
declare global {
  var mongoose: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Bitte definieren Sie die MONGODB_URI-Umgebungsvariable");
}

// Initialisiere den Cache
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

// Wenn der Cache noch nicht existiert, erstelle ihn
if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect() {
  if (cached.conn) {
    console.log("MongoDB: Bestehende Verbindung verwendet");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    console.log("MongoDB: Verbindung wird hergestellt...");
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("MongoDB: Verbindung erfolgreich hergestellt");
        return mongoose;
      })
      .catch((err) => {
        console.error("MongoDB Verbindungsfehler:", err);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("MongoDB: Verbindung fehlgeschlagen", e);
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
