import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { requireSessionAndRoles } from "@/lib/authMiddleware";
import Group from "@/lib/models/Group";
import Event from "@/lib/models/Event";
import Member from "@/lib/models/Member";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireSessionAndRoles(req, ["leader"]);
    const leaderId = user.id;

    await dbConnect();

    const { eventId, memberId, attended } = await req.json();

    if (
      !mongoose.Types.ObjectId.isValid(eventId) ||
      !mongoose.Types.ObjectId.isValid(memberId)
    ) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const group = await Group.findOne({ leader: leaderId });
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const event = await Event.findOne({ _id: eventId, group: group._id });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const member = await Member.findOne({ _id: memberId, group: group._id });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const memberObjId = new mongoose.Types.ObjectId(memberId);

    if (!event.attendance) event.attendance = [];

    if (attended) {
      const alreadyMarked = event.attendance.some((id: any) => id.equals(memberObjId));
      if (!alreadyMarked) {
        event.attendance.push(memberObjId);
      }
    } else {
      event.attendance = event.attendance.filter(
        (id: any) => !id.equals(memberObjId)
      );
    }

    await event.save();

    return NextResponse.json({
      message: "Attendance updated successfully",
      attendance: event.attendance,
    });
  } catch (err: any) {
    const status = err.name === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: err.message }, { status });
  }
}
