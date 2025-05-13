// lib/dbConnect.ts
import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI?.trim();

if (!MONGODB_URI) {
    throw new Error(
        'Please define the MONGODB_URI environment variable inside .env.local'
    );
}

interface CachedMongoose {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
}

declare global {
    // eslint-disable-next-line no-var
    var mongoose: CachedMongoose;
}

// Initialize the cache if it doesn't exist
const cached: CachedMongoose = global.mongoose || { conn: null, promise: null };

// Assign to global only if not already set
if (!global.mongoose) {
    global.mongoose = cached;
}

async function dbConnect(): Promise<Mongoose> {
    // Return cached connection if available
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        // TypeScript now knows MONGODB_URI is defined because of the early throw
        const connectionOptions: mongoose.ConnectOptions = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            retryReads: true,
        };

        // Explicit check to satisfy TypeScript
        if (MONGODB_URI) {
            cached.promise = mongoose
                .connect(MONGODB_URI, connectionOptions)
                .then((mongooseInstance: Mongoose) => {
                    console.log('✅ MongoDB Connected Successfully');
                    mongooseInstance.connection.on('error', (err) => {
                        console.error('❌ MongoDB Connection Error:', err);
                    });
                    return mongooseInstance;
                })
                .catch((error) => {
                    console.error('❌ MongoDB Connection Error:', error);
                    cached.promise = null;
                    throw new Error(`MongoDB connection failed: ${error.message}`);
                });
        } else {
            // This should theoretically never happen due to the early throw
            throw new Error('MONGODB_URI is not defined');
        }
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.conn = null;
        cached.promise = null;
        throw error;
    }

    return cached.conn;
}

export default dbConnect;