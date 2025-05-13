// lib/models/Group.ts
import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IGroup extends Document {
    name: string;
    leader?: mongoose.Types.ObjectId;
    members: mongoose.Types.ObjectId[];
}

const GroupSchema: Schema<IGroup> = new Schema(
    {
        name: { type: String, required: true },
        leader: { type: Schema.Types.ObjectId, ref: 'User' },
        members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: true }
);

export const Group = models.Group || model<IGroup>('Group', GroupSchema);
