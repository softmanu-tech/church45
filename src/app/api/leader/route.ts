import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User, IUser } from '@/lib/models/User';
import Group, { IGroup } from '@/lib/models/Group';
import Event, { IEvent } from '@/lib/models/Event';
import Attendance, { IAttendance } from '@/lib/models/Attendance';
import mongoose, { Types } from 'mongoose';

// Types
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

    const leader = await User.findById(userId).populate<{ group: IGroup }>('group');
    if (!leader || leader.role !== 'leader' || !leader.group) {
      return NextResponse.json({ error: 'Leader or group not found' }, { status: 404 });
    }

    if (groupId && groupId !== leader.group._id.toString()) {
      return NextResponse.json({ error: 'Invalid group filter' }, { status: 403 });
    }

    const attendanceFilter: Partial<Record<keyof IAttendance, unknown>> = {
      group: leader.group._id,
    };

    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      attendanceFilter.event = new mongoose.Types.ObjectId(eventId);
    }

    if (fromDate || toDate) {
      attendanceFilter.date = {};
      if (fromDate) (attendanceFilter.date as any).$gte = new Date(fromDate);
      if (toDate) (attendanceFilter.date as any).$lte = new Date(toDate);
    }

    const attendanceRecords: IAttendance[] = await Attendance.find(attendanceFilter).lean();

    const eventFilter: Partial<Record<keyof IEvent, unknown>> = { group: leader.group._id };
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      eventFilter._id = new mongoose.Types.ObjectId(eventId);
    }

    const events: IEvent[] = await Event.find(eventFilter).lean();

    const members: IUser[] = await User.find({ group: leader.group._id, role: 'member' })
      .select('name email phone')
      .lean();

    const memberAttendanceMap = new Map<string, AttendanceSummary>();
    members.forEach((m) => {
      memberAttendanceMap.set(m._id.toString(), { count: 0, lastDate: null });
    });

    attendanceRecords.forEach((record: IAttendance) => {
      record.presentMembers?.forEach((memberId: Types.ObjectId) => {
        const idStr = memberId.toString();
        if (memberAttendanceMap.has(idStr)) {
          const data = memberAttendanceMap.get(idStr)!;
          data.count += 1;
          if (!data.lastDate || record.date > data.lastDate) {
            data.lastDate = record.date;
          }
          memberAttendanceMap.set(idStr, data);
        }
      });
    });

    const enhancedMembers: EnhancedMember[] = members.map((m) => {
      const attendanceData = memberAttendanceMap.get(m._id.toString())!;
      const rating: EnhancedMember['rating'] =
        attendanceData.count > 10 ? 'Excellent' :
        attendanceData.count > 5 ? 'Average' :
        'Poor';

      return {
        _id: m._id.toString(),
        name: m.name,
        email: m.email,
        phone: m.phone ?? '', // fallback for optional field
        attendanceCount: attendanceData.count,
        lastAttendanceDate: attendanceData.lastDate,
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
        presentMembers: a.presentMembers.map((id: Types.ObjectId) => id.toString()),
      })),
    });
  } catch (error) {
    console.error('Error fetching leader dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
