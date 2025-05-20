// app/api/leader/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { Attendance } from '@/lib/models/Attendance';
import Event from '@/lib/models/Event';
import { Group } from '@/lib/models/Group'; 
import { requireSessionAndRoles } from "@/lib/authMiddleware";

import mongoose, { FilterQuery } from 'mongoose';
import { IAttendance, IUser, IGroup } from '@/lib/models';

interface EnhancedMember {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  attendanceCount: number;
  lastAttendanceDate: Date | null;
  rating: 'Excellent' | 'Average' | 'Poor';
}

export async function GET(request: Request) {
  try {
    await dbConnect();

    // 1. Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get Leader with Group
    const leader = await User.findById(user.id).populate<{ group: IGroup }>('group');
    if (!leader?.group) {
      return NextResponse.json({ error: 'Leader group not found' }, { status: 404 });
    }

    // Optionally, fetch the group details if needed
    const groupDetails = await Group.findById(leader.group._id);
    if (!groupDetails) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Debugging: Log the leader object
    console.log('Leader:', leader);

    // 3. Parse and Validate Filters
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    if (eventId && !mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID format' }, { status: 400 });
    }

    // 4. Build Secure Filters
    const attendanceFilter: FilterQuery<IAttendance> = {
      group: leader.group._id,
      ...(eventId && { event: new mongoose.Types.ObjectId(eventId) }),
      ...(fromDate || toDate) && {
        date: {
          ...(fromDate && { $gte: new Date(fromDate) }),
          ...(toDate && { $lte: new Date(toDate) })
        }
      }
    };

    // 5. Fetch Data
    const [attendanceRecords, events, rawMembers] = await Promise.all([
      Attendance.find(attendanceFilter).lean<IAttendance[]>(),
      Event.find({ group: leader.group._id }).lean(),
      User.find({ group: leader.group._id, role: 'member' })
        .select('name email phone')
        .lean<IUser[]>()
    ]);

    // 6. Process Member Attendance
    const memberStats = new Map<string, { count: number; lastDate: Date | null }>(
      rawMembers.map(m => [m._id.toString(), { count: 0, lastDate: null }])
    );

    for (const record of attendanceRecords) {
      for (const memberId of record.presentMembers) {
        const stats = memberStats.get(memberId.toString());
        if (stats) {
          stats.count++;
          if (!stats.lastDate || record.date > stats.lastDate) {
            stats.lastDate = record.date;
          }
        }
      }
    }

    // 7. Create Enhanced Members
    const enhancedMembers: EnhancedMember[] = rawMembers.map(member => {
      const stats = memberStats.get(member._id.toString())!;
      return {
        _id: member._id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        attendanceCount: stats.count,
        lastAttendanceDate: stats.lastDate,
        rating: stats.count > 10 ? 'Excellent' : stats.count > 5 ? 'Average' : 'Poor'
      };
    });

    // 8. Return Secure Response
    return NextResponse.json({
      group: {
        _id: leader.group._id.toString(),
        name: leader.group.name
      },
      events,
      members: enhancedMembers,
      attendanceRecords
    });

  } catch (error) {
    console.error('Leader API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Add Member
export async function POST(request: Request) {
  try {
    await dbConnect();

    // 1. Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get Leader with Group
    const leader = await User.findById(user.id).populate<{ group: IGroup }>('group');
    if (!leader?.group) {
      return NextResponse.json({ error: 'Leader group not found' }, { status: 404 });
    }

    // 3. Parse and Validate Request Body
    const { name, email, phone } = await request.json();
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // 4. Create New Member
    const newMember = new User({
      name,
      email,
      phone,
      role: 'member',
      group: leader.group._id
    });

    await newMember.save();

    // 5. Return Success Response
    return NextResponse.json({ message: 'Member added successfully', member: newMember });

  } catch (error) {
    console.error('Leader API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
// PUT: Update Member
export async function PUT(request: Request) {
  try {
    await dbConnect();

    // 1. Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get Leader with Group
    const leader = await User.findById(user.id).populate<{ group: IGroup }>('group');
    if (!leader?.group) {
      return NextResponse.json({ error: 'Leader group not found' }, { status: 404 });
    }

    // 3. Parse and Validate Request Body
    const { memberId, name, email, phone } = await request.json();
    if (!memberId || !name || !email) {
      return NextResponse.json({ error: 'Member ID, name, and email are required' }, { status: 400 });
    }

    // 4. Find and Update Member
    const updatedMember = await User.findOneAndUpdate(
      { _id: memberId, group: leader.group._id },
      { name, email, phone },
      { new: true }
    );

    if (!updatedMember) {
      return NextResponse.json({ error: 'Member not found or not in your group' }, { status: 404 });
    }

    // 5. Return Success Response
    return NextResponse.json({ message: 'Member updated successfully', member: updatedMember });

  } catch (error) {
    console.error('Leader API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
// DELETE: Remove Member
export async function DELETE(request: Request) {
  try {
    await dbConnect();

    // 1. Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get Leader with Group
    const leader = await User.findById(user.id).populate<{ group: IGroup }>('group');
    if (!leader?.group) {
      return NextResponse.json({ error: 'Leader group not found' }, { status: 404 });
    }

    // 3. Parse and Validate Request Body
    const { memberId } = await request.json();
    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    // 4. Find and Delete Member
    const deletedMember = await User.findOneAndDelete({
      _id: memberId,
      group: leader.group._id
    });

    if (!deletedMember) {
      return NextResponse.json({ error: 'Member not found or not in your group' }, { status: 404 });
    }

    // 5. Return Success Response
    return NextResponse.json({ message: 'Member removed successfully' });

  } catch (error) {
    console.error('Leader API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
// Create Event
export async function createEvent(request: Request) {
  const { user } = await requireSessionAndRoles(request, ["leader"]);
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, date } = await request.json();

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
export async function markAttendance(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ["leader"]);
    const leaderId = user.id;

    await dbConnect();

    const { eventId, memberId, attended } = await request.json();

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
export async function POST(request: Request) {
  const { action } = await request.json(); // Expecting an action to determine what to do

  if (action === "createEvent") {
    return createEvent(request);
  } else if (action === "markAttendance") {
    return markAttendance(request);
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
}
