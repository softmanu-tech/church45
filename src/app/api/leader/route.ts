// app/api/leader/dashboard/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import Group from '@/lib/models/Group';
import Event from '@/lib/models/Event';
import Attendance from '@/lib/models/Attendance'; // assuming attendance model exists
import mongoose from 'mongoose';

// Create interfaces for clarity
interface AttendanceRecord {
  date: Date;
  presentMembers: mongoose.Types.ObjectId[];
}

interface Member {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
}


export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const groupId = url.searchParams.get('groupId');
    const eventId = url.searchParams.get('eventId');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');

    const attendanceRecords = await Attendance.find(attendanceFilter).lean<AttendanceRecord[]>();
    const members = await User.find({ group: leader.group._id, role: 'member' })
    .select('name email phone')
    .lean<Member[]>();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    await dbConnect();

    const leader = await User.findById(userId).populate('group');
    if (!leader || leader.role !== 'leader' || !leader.group) {
      return NextResponse.json({ error: 'Leader or group not found' }, { status: 404 });
    }

    // Validate group filter - only allow leader's own group or no filter
    if (groupId && groupId !== leader.group._id.toString()) {
      return NextResponse.json({ error: 'Invalid group filter' }, { status: 403 });
    }

    // Build attendance filter
    const attendanceFilter: any = { group: leader.group._id };
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      attendanceFilter.event = eventId;
    }
    if (fromDate || toDate) {
      attendanceFilter.date = {};
      if (fromDate) attendanceFilter.date.$gte = new Date(fromDate);
      if (toDate) attendanceFilter.date.$lte = new Date(toDate);
    }

    // Fetch attendance records for the filters
    const attendanceRecords = await Attendance.find(attendanceFilter).lean();

    // Fetch events for the group (optionally filtered)
    const eventFilter: any = { group: leader.group._id };
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      eventFilter._id = eventId;
    }
    const events = await Event.find(eventFilter).lean();

    // Fetch members of the group
    const members = await User.find({ group: leader.group._id, role: 'member' })
      .select('name email phone')
      .lean();

    // Analyze attendance per member, last attendance date, and rating
    const memberAttendanceMap = new Map<string, { count: number; lastDate: Date | null }>();

    members.forEach((m) => {
      memberAttendanceMap.set(m._id.toString(), { count: 0, lastDate: null });
    });

    attendanceRecords.forEach((record) => {
      record.presentMembers?.forEach((memberId: mongoose.Types.ObjectId) => {
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

    const enhancedMembers = members.map((m) => {
      const attendanceData = memberAttendanceMap.get(m._id.toString())!;
      // Simple rating logic
      const rating =
        attendanceData.count > 10 ? 'Excellent' :
        attendanceData.count > 5 ? 'Average' :
        'Poor';

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