import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from 'bcrypt';

export interface IMember extends Document {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  location?: string;
  group: mongoose.Types.ObjectId; // ref to Group
  role: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  leader: mongoose.Types.ObjectId; // ref to User
}

const MemberSchema: Schema<IMember> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, match: /.+\@.+\..+/ },
    phone: { type: String },
    department: { type: String },
    location: { type: String },
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    leader: { type: Schema.Types.ObjectId, ref: "User ", required: true },
    role: { type: String, required: true, enum: ["member", "leader"] },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

// Hash the password before saving
MemberSchema.pre<IMember>('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

const Member: Model<IMember> = mongoose.models.Member || mongoose.model<IMember>("Member", MemberSchema);
export default Member;
