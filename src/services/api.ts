import Event, { type IEvent } from "@/lib/models/Event"; // Correct import

const events: IEvent[] = await Event.find({ group: leader.group._id }).sort({ date: 1 }).lean();

const formattedEvents = events.map((event) => ({
  _id: event._id.toString(),
  title: event.title,
  date: event.date.toISOString(),
  description: event.description,
  groupId: leader.group._id.toString(),
}));
