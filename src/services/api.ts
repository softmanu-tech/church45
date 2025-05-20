import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { requireSessionAndRoles } from "@/lib/authMiddleware";
import Event from "@/lib/models/Event";
import { User } from "@/lib/models/User";
import { Group } from "@/lib/models/Group";
import Member from "@/lib/models/Member";
import mongoose from "mongoose";

// Create Event
export async function createEvent(req: NextRequest) {
  const { user } = await requireSessionAndRoles(req, ["leader"]);
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, date } = await req.json();

  try {
    await dbConnect();

    const leader = await User.findById(user.id).populate("group");
    if (!leader || !leader.group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const event = new Event({
      title,
      description,
      date: new Date(date),
      group: leader.group._id,
    });

    await event.save();

    return NextResponse.json({ message: "Event created successfully", event });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

// Mark Attendance
export async function markAttendance(req: NextRequest) {
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
      const alreadyMarked = event.attendance.some((id) => id.equals(memberObjId));
      if (!alreadyMarked) {
        event.attendance.push(memberObjId);
      }
    } else {
      event.attendance = event.attendance.filter(
        (id) => !id.equals(memberObjId)
      );
    }

    await event.save();

    return NextResponse.json({
      message: "Attendance updated successfully",
      attendance: event.attendance,
    });
  } catch (err: any) {
    console.error("Error marking attendance:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

// Main handler for the route
export async function POST(req: NextRequest) {
  const { action } = await req.json(); // Expecting an action to determine what to do

  if (action === "createEvent") {
    return createEvent(req);
  } else if (action === "markAttendance") {
    return markAttendance(req);
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
}
