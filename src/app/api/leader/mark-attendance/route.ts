// pages/api/leader/mark-attendance.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { requireSessionAndRole } from "../../../lib/authMiddleware";
import Group from "@/lib/models/Group";
import Event from "@/lib/models/Event";
import Member from "@/lib/models/Member";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await requireSessionAndRole(req, res, "leader");
  if (!session) return;

  try {
    const leaderId = session.user.id;
    const { eventId, memberId, attended } = req.body;

    const group = await Group.findOne({ leader: leaderId });
    if (!group) return res.status(404).json({ error: "Group not found" });

    const event = await Event.findOne({ _id: eventId, group: group._id });
    if (!event) return res.status(404).json({ error: "Event not found" });

    const member = await Member.findOne({ _id: memberId, group: group._id });
    if (!member) return res.status(404).json({ error: "Member not found" });

    // Assume event.attendance is a Map or array, adjust accordingly
    // For example, attendance as array of member IDs who attended:
    if (!event.attendance) event.attendance = [];

    if (attended) {
      if (!event.attendance.includes(memberId)) event.attendance.push(memberId);
    } else {
      event.attendance = event.attendance.filter((id) => id.toString() !== memberId.toString());
    }

    await event.save();

    res.status(200).json({ message: "Attendance updated", attendance: event.attendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
