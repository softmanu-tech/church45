import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { Attendance } from '@/lib/models/Attendance';
import Event from '@/lib/models/Event';
import Group from '@/lib/models/Group'; 
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

    // 3. Fetch Members
    const members = await User.find({ group: leader.group._id, role: 'member' })
      .select('name email phone')
      .lean<IUser []>();

    // 4. Return Members
    return NextResponse.json({
      group: {
        _id: leader.group._id.toString(),
        name: leader.group.name
      },
      members,
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
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, phone } = await request.json();
    const leader = await User.findById(user.id).populate<{ group: IGroup }>('group');

    if (!leader?.group) {
      return NextResponse.json({ error: 'Leader group not found' }, { status: 404 });
    }

    const newMember = new User({
      name,
      email,
      phone,
      group: leader.group._id,
      role: 'member'
    });

    await newMember.save();
    return NextResponse.json({ message: 'Member added successfully', member: newMember });

  } catch (error) {
    console.error('Add Member Error:', error);
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
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memberId } = await request.json();
    await User.findByIdAndDelete(memberId);
    return NextResponse.json({ message: 'Member deleted successfully' });

  } catch (error) {
    console.error('Delete Member Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Create Event
export async function createEvent(request: Request) {
  try {
    await dbConnect();
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, date } = await request.json();
    const leader = await User.findById(user.id).populate<{ group: IGroup }>('group');

    if (!leader?.group) {
      return NextResponse.json({ error: 'Leader group not found' }, { status: 404 });
    }

    const newEvent = new Event({
      name,
      date,
      group: leader.group._id
    });

    await newEvent.save();
    return NextResponse.json({ message: 'Event created successfully', event: newEvent });

  } catch (error) {
    console.error('Create Event Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Mark Attendance
export async function markAttendance(request: Request) {
  try {
    await dbConnect();
    const { user } = await requireSessionAndRoles(request, ['leader']);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, presentMembers } = await request.json();
    const leader = await User.findById(user.id).populate<{ group: IGroup }>('group');

    if (!leader?.group) {
      return NextResponse.json({ error: 'Leader group not found' }, { status: 404 });
    }

    const attendanceRecord = new Attendance({
      event: eventId,
      group: leader.group._id,
      date: new Date(),
      presentMembers
    });

    await attendanceRecord.save();
    return NextResponse.json({ message: 'Attendance marked successfully', attendance: attendanceRecord });

  } catch (error) {
    console.error('Mark Attendance Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
