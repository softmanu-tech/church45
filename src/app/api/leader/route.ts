// app/api/leader/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { IGroup } from '@/lib/models/Group';
import Event from '@/lib/models/Event';
import { Attendance, IAttendance } from '@/lib/models/Attendance';
import mongoose, { FilterQuery } from 'mongoose';
import { requireSessionAndRoles } from "@/lib/authMiddleware";

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
    console.log('[API] Connecting to DB...');
    await dbConnect();

    console.log('[API] Validating session and roles...');
    const session = await requireSessionAndRoles(request, ['leader']);

    if (!session) {
      console.warn('[API] Unauthorized: No valid session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    const leaderId = new mongoose.Types.ObjectId(user.id);

    const url = new URL(request.url);
    const groupId = url.searchParams.get('groupId');
    const eventId = url.searchParams.get('eventId');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');

    console.log('[API] Query Params:', { groupId, eventId, fromDate, toDate });

    const leader = await User.findById(leaderId).populate<{ group: IGroup }>('group');
    if (!leader || !leader.group) {
      console.warn('[API] Leader or group not found:', leaderId);
      return NextResponse.json({ error: 'Leader or group not found' }, { status: 404 });
    }

    const leaderGroupId = leader.group._id.toString();
    console.log('[API] Leader Group ID:', leaderGroupId);

    if (groupId && groupId !== leaderGroupId) {
      console.warn('[API] Invalid group filter. Expected:', leaderGroupId, 'Received:', groupId);
      return NextResponse.json({ error: 'Invalid group filter' }, { status: 403 });
    }

    const attendanceFilter: FilterQuery<IAttendance> = { group: leader.group._id };
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      attendanceFilter.event = new mongoose.Types.ObjectId(eventId);
    }

    if (fromDate || toDate) {
      const dateFilter: Record<string, Date> = {};
      if (fromDate) dateFilter.$gte = new Date(fromDate);
      if (toDate) dateFilter.$lte = new Date(toDate);
      attendanceFilter.date = dateFilter;
    }

    console.log('[API] Attendance Filter:', attendanceFilter);

    console.log('[API] Fetching attendance records, events, and members...');
    const [attendanceRecords, events, rawMembers] = await Promise.all([
      Attendance.find(attendanceFilter).lean<IAttendance[]>(),
      Event.find({ group: leader.group._id }).lean(),
      User.find({ group: leader.group._id, role: 'member' }).select('name email phone').lean()
    ]);

    console.log('[API] Fetched Records Count:', {
      attendanceRecords: attendanceRecords.length,
      events: events.length,
      members: rawMembers.length,
    });

    const members: Member[] = rawMembers.map((m) => ({
      _id: m._id,
      name: m.name,
      email: m.email,
      phone: m.phone,
    }));

    const memberAttendanceMap = new Map<string, { count: number; lastDate: Date | null }>();
    members.forEach((m) => memberAttendanceMap.set(m._id.toString(), { count: 0, lastDate: null }));

    attendanceRecords.forEach((record) => {
      record.presentMembers.forEach((memberId) => {
        const idStr = memberId.toString();
        const data = memberAttendanceMap.get(idStr);
        if (data) {
          data.count += 1;
          if (!data.lastDate || record.date > data.lastDate) {
            data.lastDate = record.date;
          }
        }
      });
    });

    const enhancedMembers: EnhancedMember[] = members.map((m) => {
      const data = memberAttendanceMap.get(m._id.toString());
      const attendanceCount = data?.count ?? 0;
      const lastAttendanceDate = data?.lastDate ?? null;
      const rating = attendanceCount > 10 ? 'Excellent' : attendanceCount > 5 ? 'Average' : 'Poor';

      return {
        ...m,
        attendanceCount,
        lastAttendanceDate,
        rating,
      };
    });

    console.log('[API] Returning final result...');
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
    console.error('[API] Error fetching leader dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch data', details: String(error) }, { status: 500 });
  }
}
