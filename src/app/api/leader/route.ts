// app/api/leader/dashboard/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User, IUser } from '@/lib/models/User';
import {Group, IGroup } from '@/lib/models/Group';
import Event from '@/lib/models/Event';
import { Attendance, IAttendance } from '@/lib/models/Attendance';
import mongoose from 'mongoose';

interface Member {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
}

interface EnhancedMember extends Member {
  attendanceCount: number;
  lastAttendanceDate: Date | null;
  rating: 'Excellent' | 'Average' | 'Poor';
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const groupId = url.searchParams.get('groupId');
    const eventId = url.searchParams.get('eventId');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid or missing userId' }, { status: 400 });
    }

    await dbConnect();

    const leader = await User.findById(userId).populate<{ group: IGroup }>('group');
    if (!leader || leader.role !== 'leader' || !leader.group) {
      return NextResponse.json({ error: 'Leader or group not found' }, { status: 404 });
    }

    if (groupId && groupId !== leader.group._id.toString()) {
      return NextResponse.json({ error: 'Invalid group filter' }, { status: 403 });
    }

    // Attendance filter
    const attendanceFilter: Record<string, any> = { group: leader.group._id };
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      attendanceFilter.event = new mongoose.Types.ObjectId(eventId);
    }
    if (fromDate || toDate) {
      attendanceFilter.date = {};
      if (fromDate) attendanceFilter.date.$gte = new Date(fromDate);
      if (toDate) attendanceFilter.date.$lte = new Date(toDate);
    }

    const attendanceRecords = await Attendance.find(attendanceFilter).lean<IAttendance[]>();

    // Event filter
    const eventFilter: Record<string, any> = { group: leader.group._id };
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      eventFilter._id = new mongoose.Types.ObjectId(eventId);
    }

    const events = await Event.find(eventFilter).lean();

    // Fetch group members
    const rawMembers = await User.find({
      group: leader.group._id,
      role: 'member',
    }).select('name email phone').lean<IUser[]>();

    // Filter out members missing phone (to match expected type)
    const members: Member[] = rawMembers
      .filter((m): m is Member => typeof m.phone === 'string')
      .map((m) => ({
        _id: m._id,
        name: m.name,
        email: m.email,
        phone: m.phone,
      }));

    // Track attendance per member
    const memberAttendanceMap = new Map<string, { count: number; lastDate: Date | null }>();

    members.forEach((m) => {
      memberAttendanceMap.set(m._id.toString(), { count: 0, lastDate: null });
    });

    attendanceRecords.forEach((record: IAttendance) => {
      record.presentMembers.forEach((memberId: mongoose.Types.ObjectId) => {
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
      const rating =
        attendanceData.count > 10
          ? 'Excellent'
          : attendanceData.count > 5
          ? 'Average'
          : 'Poor';

      return {
        ...m,
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
      events,
      members: enhancedMembers,
      attendanceRecords,
    });
  } catch (error) {
    console.error('Error fetching leader dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
