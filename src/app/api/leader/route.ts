// app/api/leader/dashboard/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User, IUser } from '@/lib/models/User';
import { IGroup } from '@/lib/models/Group';
import Event, { IEvent } from '@/lib/models/Event';
import { Attendance, IAttendance } from '@/lib/models/Attendance';
import mongoose, { FilterQuery } from 'mongoose';
import { requireSessionAndRole } from '@/lib/authMiddleware';

interface Member {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
}

interface EnhancedMember extends Member {
  attendanceCount: number;
  lastAttendanceDate: Date | null;
  rating: 'Excellent' | 'Average' | 'Poor';
}

export async function GET(request: Request) {
  try {
    await dbConnect();

    // 🔐 Securely get logged-in user
    const { user } = await requireSessionAndRole(request, 'leader');

    const url = new URL(request.url);
    const groupId = url.searchParams.get('groupId');
    const eventId = url.searchParams.get('eventId');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');

    // ✅ Lookup leader and group from DB
    const leader = await User.findById(user._id).populate<{ group: IGroup }>('group');
    if (!leader || !leader.group) {
      return NextResponse.json({ error: 'Leader or group not found' }, { status: 404 });
    }

    if (groupId && groupId !== leader.group._id.toString()) {
      return NextResponse.json({ error: 'Invalid group filter' }, { status: 403 });
    }

    // 📅 Attendance filter
    const attendanceFilter: FilterQuery<IAttendance> = { group: leader.group._id };
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      attendanceFilter.event = new mongoose.Types.ObjectId(eventId);
    }
    if (fromDate || toDate) {
      attendanceFilter.date = {};
      if (fromDate) attendanceFilter.date.$gte = new Date(fromDate);
      if (toDate) attendanceFilter.date.$lte = new Date(toDate);
    }

    const attendanceRecords = await Attendance.find(attendanceFilter).lean<IAttendance[]>();

    // 🗓 Event filter
    const eventFilter: FilterQuery<IEvent> = { group: leader.group._id };
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      eventFilter._id = new mongoose.Types.ObjectId(eventId);
    }

    const events = await Event.find(eventFilter).lean();

    // 👥 Members
    const rawMembers = await User.find({
      group: leader.group._id,
      role: 'member',
    })
      .select('name email phone')
      .lean<IUser[]>();

    const members: Member[] = rawMembers.map((m) => ({
      _id: m._id,
      name: m.name,
      email: m.email,
      phone: m.phone,
    }));

    // 📊 Attendance stats
    const memberAttendanceMap = new Map<string, { count: number; lastDate: Date | null }>();
    members.forEach((m) => memberAttendanceMap.set(m._id.toString(), { count: 0, lastDate: null }));

    attendanceRecords.forEach((record: IAttendance) => {
      record.presentMembers.forEach((memberId: mongoose.Types.ObjectId) => {
        const idStr = memberId.toString();
        if (memberAttendanceMap.has(idStr)) {
          const data = memberAttendanceMap.get(idStr)!;
          data.count += 1;
          if (!data.lastDate || record.date > data.lastDate) {
            data.lastDate = record.date;
          }
        }
      });
    });

    const enhancedMembers: EnhancedMember[] = members.map((m) => {
      const data = memberAttendanceMap.get(m._id.toString())!;
      const rating =
        data.count > 10 ? 'Excellent' : data.count > 5 ? 'Average' : 'Poor';

      return {
        ...m,
        attendanceCount: data.count,
        lastAttendanceDate: data.lastDate,
        rating,
      };
    });

    return NextResponse.json({
      group: {
        _id: leader.group._id.toString(),
        name: leader.group.name,
      },
      events,
      members: enhancedMembers,
      attendanceRecords,
    });
  } catch (error: any) {
    console.error('Error fetching leader dashboard data:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}
