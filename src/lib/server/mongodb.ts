import mongoose from 'mongoose'

/**
 * Cached MongoDB connection.
 *
 * On Vercel every API route runs as a serverless function. Without caching, each
 * invocation would open a new connection and quickly exhaust the Atlas pool, so
 * the connection promise is stored on `globalThis` and reused across warm
 * invocations (and across hot reloads in dev).
 */

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

const globalForMongoose = globalThis as unknown as { _mongoose?: MongooseCache }
const cache: MongooseCache = globalForMongoose._mongoose ?? { conn: null, promise: null }
globalForMongoose._mongoose = cache

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to your environment (Vercel → Project → Settings → Environment Variables).')
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || undefined, // falls back to the db name in the URI
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
    })
  }

  try {
    cache.conn = await cache.promise
  } catch (e) {
    cache.promise = null // allow a retry on the next request
    throw e
  }
  return cache.conn
}
