import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import dbConnect from "@/lib/dbConnect"
import { type IUser, User } from "@/lib/models/User"
import { Event, type IEvent } from "@/lib/models/Event"

export async function GET() {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // Fetch leader's group
    const leader = await User.findById(session.user.id).populate("group")
    if (!leader?.group) {
      return NextResponse.json({ group: null, events: [], members: [] })
    }

    // Ensure the user is a leader
    if (leader.role !== "leader") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch group events
    const events = await Event.find({ group: leader.group._id })
      .sort({ date: 1 }) 
      .lean<IEvent[]>() 

    // Fetch group members
    const members = await User.find({ group: leader.group._id, role: "member" })
      .select("name email phone")
      .lean<IUser[]>() // Return plain JavaScript objects

    // Respond with the leader's group, events, and members
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
    })
  } catch (error) {
    console.error("Error fetching leader data:", error)
    return NextResponse.json({ error: "Failed to fetch leader data" }, { status: 500 })
  }
}
