// src/lib/models/Member.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMember extends Document {
    name: string;
    email: string;
    phone: string;
    department: string;
    location: string;
    groupId: string; // Reference to the group
    role: string; // e.g., 'member', 'leader'
    password: string; // Hashed password
    leader: string; // Reference to the leader
}

const memberSchema = new Schema<IMember>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    department: { type: String, required: false },
    location: { type: String, required: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    role: { type: String, required: true, enum: ['member', 'leader'] },
    password: { type: String, required: true },
    leader: { type: String, required: true }, // Ensure this is defined
});

export const Member = mongoose.models.Member || mongoose.model<IMember>('Member', memberSchema);
