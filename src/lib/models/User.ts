// lib/models/User.ts
import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    role: 'bishop' | 'leader' | 'member'; // Added 'member'
    group?: mongoose.Types.ObjectId;
    phone?: string;
}

const UserSchema: Schema<IUser> = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['bishop', 'leader', 'member'], required: true }, // Added 'member'
        group: { type: Schema.Types.ObjectId, ref: 'Group' },
    },
    { timestamps: true }
);

export const User = models.User || model<IUser>('User', UserSchema);
// src/lib/models/User.ts
// Add this at the end:
export type { IUser };