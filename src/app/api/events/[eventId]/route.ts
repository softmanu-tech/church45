// models/Event.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEvent extends Document {
  title: string;
  date: Date;
  location?: string;
  group: mongoose.Types.ObjectId; // ref to Group
  attendance: mongoose.Types.ObjectId[]; // member IDs who attended
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema: Schema<IEvent> = new Schema(
  {
    title: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String },
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    attendance: [{ type: Schema.Types.ObjectId, ref: "Member" }],
  },
  { timestamps: true }
);

const Event: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);
export default Event;
