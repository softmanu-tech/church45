import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { requireSessionAndRole } from "@/lib/authMiddleware";
import Group from "@/lib/models/Group";
import Event from "@/lib/models/Event";
import Member from "@/lib/models/Member";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  const session = await requireSessionAndRole(req, "leader");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    const { eventId, memberId, attended } = await req.json();
    const leaderId = session.user;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(eventId) ||
      !mongoose.Types.ObjectId.isValid(memberId)
    ) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Get the group led by this leader
    const group = await Group.findOne({ leader: leaderId });
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Get the event within the leader's group
    const event = await Event.findOne({ _id: eventId, group: group._id });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Ensure member belongs to the same group
    const member = await Member.findOne({ _id: memberId, group: group._id });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Initialize attendance if not present
    if (!event.attendance) {
      event.attendance = [];
    }

    const memberObjId = new mongoose.Types.ObjectId(memberId);

    if (attended) {
      if (!event.attendance.some((id: any) => id.equals(memberObjId))) {
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
  } catch (error) {
    console.error("Error marking attendance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
