// src/lib/models/User.ts
import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IUser extends Document {
  // ... other fields
  group?: mongoose.Types.ObjectId;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    // ... other fields
    group: { type: Schema.Types.ObjectId, ref: 'Group' },
  },
  { timestamps: true }
);