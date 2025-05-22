// models/Member.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMember extends Document {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  location?: string;
  group: mongoose.Types.ObjectId; // ref to Group
  role: string;
  password: string
  createdAt: Date;
  updatedAt: Date;
  leader: mongoose.Types.ObjectId; // ref to User
}

const MemberSchema: Schema<IMember> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String},
    phone: { type: String },
    department: { type: String },
    location: { type: String },
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    leader: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true, enum: ["member", "leader"] },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const Member: Model<IMember> = mongoose.models.Member || mongoose.model<IMember>("Member", MemberSchema);
export default Member;
