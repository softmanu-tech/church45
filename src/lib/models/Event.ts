// models/Event.ts
import { User } from "@/lib/models/User";
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  date: Date;
  location?: string;
  description?: string;
  group: mongoose.Types.ObjectId; // ref to Group
  attendance: mongoose.Types.ObjectId[]; // member IDs who attended
  createdBy: mongoose.Types.ObjectId | typeof User
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema: Schema<IEvent> = new Schema(
  {

    title: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String },
    description: { type: String },
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    attendance: [{ type: Schema.Types.ObjectId, ref: "Member" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Event: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);
export default Event;
