import mongoose, { Schema, Document, models, model } from 'mongoose';

// Define interface
export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    role: 'bishop' | 'leader' | 'member';
    group?: mongoose.Types.ObjectId;
    phone?: string;
}

// Define schema
const UserSchema: Schema<IUser> = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['bishop', 'leader', 'member'], required: true },
        group: { type: Schema.Types.ObjectId, ref: 'Group' },
        phone: String,
    },
    { timestamps: true }
);

// Export model
export const User = models.User || model<IUser>('User', UserSchema);