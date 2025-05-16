// app/api/leader/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { requireSessionAndRole } from "@/lib/authMiddleware";
import { User, type IUser } from "@/lib/models/User";
import  Event,{type IEvent}   from "@/lib/models/Event";

export async function GET(req: NextRequest) {
  const auth = await requireSessionAndRole(req, "leader");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const leaderId = auth.session.user.id;

  try {
    await dbConnect();

    const leader = await User.findById(leaderId).populate("group");
    if (!leader || !leader.group) {
      return NextResponse.json({ group: null, events: [], members: [] });
    }

    const events: IEvent[] = await Event.find({ group: leader.group._id }).sort({ date: 1 }).lean();
    const members = await User.find({ group: leader.group._id, role: "member" })
      .select("name email phone")
      .lean<IUser[]>();

    return NextResponse.json({
      group: {
        _id: leader.group._id.toString(),
        name: leader.group.name,
      },
      events: events.map((event) => ({
        _id: event._id.toString(),
        title: event.title,
        date: event.date.toISOString(),
        description: event.description,
        groupId: leader.group._id.toString(),
      })),
      members: members.map((member) => ({
        _id: member._id.toString(),
        name: member.name,
        email: member.email,
        phone: member.phone,
      })),
    });
  } catch (error) {
    console.error("Error fetching leader data:", error);
    return NextResponse.json({ error: "Failed to fetch leader data" }, { status: 500 });
  }
}
