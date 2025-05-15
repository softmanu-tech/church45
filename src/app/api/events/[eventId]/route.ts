// models/Member.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMember extends Document {
  name: string;
  email: string;
  phone?: string;
  lo
  group: mongoose.Types.ObjectId; // ref to Group
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema: Schema<IMember> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
  },
  { timestamps: true }
);

const Member: Model<IMember> = mongoose.models.Member || mongoose.model<IMember>("Member", MemberSchema);
export default Member;
