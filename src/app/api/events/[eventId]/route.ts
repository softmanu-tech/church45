// models/Group.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGroup extends Document {
  name: string;
  leader?: mongoose.Types.ObjectId; // ref to User with role leader
  members: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema: Schema<IGroup> = new Schema(
  {
    name: { type: String, required: true },
    leader: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members:
  },
  { timestamps: true }
);

const Group: Model<IGroup> = mongoose.models.Group || mongoose.model<IGroup>("Group", GroupSchema);
export default Group;
