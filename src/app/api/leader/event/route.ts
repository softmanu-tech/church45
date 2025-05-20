import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { requireSessionAndRoles } from "@/lib/authMiddleware";
import  Event  from "@/lib/models/Event";
import { User } from "@/lib/models/User";

export async function POST(req: NextRequest) {
  const auth = await requireSessionAndRoles(req, ["leader"]);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    return NextResponse.json({ message: "Event created successfully" });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
