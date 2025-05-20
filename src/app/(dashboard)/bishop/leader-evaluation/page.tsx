// src/lib/models/Group.ts
import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  leader: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema: Schema<IGroup> = new Schema(
  {
    name: { type: String, required: true },
    leader: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Ensure the model is registered
export const Group = models.Group || model<IGroup>("Group", GroupSchema);