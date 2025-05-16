import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User, IUser } from '@/lib/models/User';
import Group, { IGroup } from '@/lib/models/Group';
import Event, { IEvent } from '@/lib/models/Event';
import Attendance, { IAttendance } from '@/lib/models/Attendance';
import mongoose from 'mongoose';

// Custom types
interface AttendanceSummary {
  count: number;
  lastDate: Date | null;
}

interface EnhancedMember {
  _id: string;
  name: string;
  email: string;
  phone: string;
  attendanceCount: number;
  lastAttendanceDate: Date | null;
  rating: 'Excellent' | 'Average' | 'Poor';
}

export async function GET(request: Request) {
  try {
    await dbConnect();

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const groupId = url.searchParams.get('groupId');
    const eventId = url.searchParams.get('eventId');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Missing or invalid userId' }, { status: 400 });
    }

    // Get leader and group
    const leader = await User.findById(userId).populate<{ group: IGroup }>('group');
    if (!leader || leader.role !== 'leader' || !leader.group) {
      return NextResponse.json({ error: 'Leader or group not found' }, { status: 404 });
    }

    // Validate group filter
    if (groupId && groupId !== leader.group._id.toString()) {
      return NextResponse.json({ error: 'Invalid group filter' }, { status: 403 });
    }

    // Build attendance filter
    const attendanceFilter: Partial<Record<keyof IAttendance, any>> = {
      group: leader.group._id,
    };

    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      attendanceFilter.event = new mongoose.Types.ObjectId(eventId);
    }

    if (fromDate || toDate) {
      attendanceFilter.date = {};
      if (fromDate) attendanceFilter.date.$gte = new Date(fromDate);
      if (toDate) attendanceFilter.date.$lte = new Date(toDate);
    }

    const attendanceRecords = await Attendance.find(attendanceFilter).lean<IAttendance[]>();

    // Fetch events
    const eventFilter: Partial<Record<keyof IEvent, any>> = { group: leader.group._id };
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      eventFilter._id = new mongoose.Types.ObjectId(eventId);
    }
    const events = await Event.find(eventFilter).lean<IEvent[]>();

    // Fetch members
    const members = await User.find({ group: leader.group._id, role: 'member' })
      .select('name email phone')
      .lean<IUser[]>();

    // Analyze attendance
    const memberAttendanceMap = new Map<string, AttendanceSummary>();
    members.forEach((m) => {
      memberAttendanceMap.set(m._id.toString(), { count: 0, lastDate: null });
    });

    attendanceRecords.forEach((record) => {
      record.presentMembers?.forEach((memberId) => {
        const idStr = memberId.toString();
        if (memberAttendanceMap.has(idStr)) {
          const summary = memberAttendanceMap.get(idStr)!;
          summary.count += 1;
          if (!summary.lastDate || record.date > summary.lastDate) {
            summary.lastDate = record.date;
          }
          memberAttendanceMap.set(idStr, summary);
        }
      });
    });

    const enhancedMembers: EnhancedMember[] = members.map((m) => {
      const attendance = memberAttendanceMap.get(m._id.toString())!;
      const rating =
        attendance.count > 10
          ? 'Excellent'
          : attendance.count > 5
          ? 'Average'
          : 'Poor';

      return {
        _id: m._id.toString(),
        name: m.name,
        email: m.email,
        phone: m.phone,
        attendanceCount: attendance.count,
        lastAttendanceDate: attendance.lastDate,
        rating,
      };
    });

    return NextResponse.json({
      group: {
        _id: leader.group._id.toString(),
        name: leader.group.name,
      },
      events: events.map((e) => ({
        _id: e._id.toString(),
        title: e.title,
        date: e.date,
        description: e.description,
        location: e.location,
      })),
      members: enhancedMembers,
      attendanceRecords: attendanceRecords.map((a) => ({
        _id: a._id.toString(),
        event: a.event.toString(),
        group: a.group.toString(),
        date: a.date,
        presentMembers: a.presentMembers.map((id) => id.toString()),
      })),
    });
  } catch (error) {
    console.error('Error fetching leader dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
