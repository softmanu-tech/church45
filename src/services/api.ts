import { requireSessionAndRoles } from "@/lib/auth";
import { NextResponse } from "next/server";
import User from "@/models/User";
import Attendance from "@/models/Attendance";
import Event from "@/models/Event";
import dbConnect from "@/lib/dbConnect";
import { isValidObjectId } from "mongoose";

export async function GET(request: Request) {
  await dbConnect();

  // ✅ Check 1: Auth and Role Check
  const session = await requireSessionAndRoles(request, ['leader']);
  const leaderId = session.user.id;

  // ✅ Check 2: Leader and Group Existence
  const leader = await User.findById(leaderId).populate<{ group: any }>('group');
  if (!leader || !leader.group) {
    return NextResponse.json({ error: 'Leader or group not found' }, { status: 404 });
  }

  const url = new URL(request.url);
  const groupId = url.searchParams.get("groupId");
  const eventId = url.searchParams.get("eventId");
  const status = url.searchParams.get("status");

  // ✅ Check 3: Validate ObjectIds
  if (groupId && !isValidObjectId(groupId)) {
    return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
  }

  if (eventId && !isValidObjectId(eventId)) {
    return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
  }

  // ✅ Check 4: Only allow groupId matching the leader's group
  if (groupId && groupId !== leader.group._id.toString()) {
    return NextResponse.json({ error: 'Unauthorized group access' }, { status: 403 });
  }

  // ✅ Check 5: Validate event ownership (optional but good)
  if (eventId) {
    const event = await Event.findById(eventId);
    if (!event || event.group.toString() !== leader.group._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized event access' }, { status: 403 });
    }
  }

  // ✅ Check 6: Prepare filters securely
  const filter: any = { group: leader.group._id };
  if (eventId) filter.event = eventId;
  if (status) filter.status = status;

  // ✅ Optional: Pagination / Limiting (good for large data)
  const limit = Math.min(Number(url.searchParams.get("limit") || 100), 200);
  const page = Number(url.searchParams.get("page") || 1);
  const skip = (page - 1) * limit;

  const attendance = await Attendance.find(filter)
    .populate("user", "name email")
    .populate("event", "name date")
    .skip(skip)
    .limit(limit)
    .exec();

  return NextResponse.json(attendance);
}
