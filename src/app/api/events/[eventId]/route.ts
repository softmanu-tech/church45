// models/User.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // hashed password if you use it
  role: "bishop" | "leader" | "member";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional if using OAuth only
    role: { type: String, enum: ["bishop", "leader", "member"], required: true },
  },
  { timestamps: true }
);

// Avoid model overwrite error in dev mode
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
