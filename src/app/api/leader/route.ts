// app/api/leader/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { Attendance } from '@/lib/models/Attendance';
import Event from '@/lib/models/Event';
import { requireSessionAndRoles } from "@/lib/authMiddleware";
import mongoose, { FilterQuery } from 'mongoose';
import { IAttendance } from '@/lib/models/Attendance';
import { IUser } from '@/lib/models/User';
import { IGroup } from '@/lib/models/Group';

// Types
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

    // ✅ Authentication & Role Check
    const session = await requireSessionAndRoles(request, ['leader']);
    const { searchParams } = new URL(request.url);


    console.log('Query params:', Object.fromEntries(searchParams.entries()));
    console.log('Session user:', session?.user?.id);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    

    const leaderId = new mongoose.Types.ObjectId(session.user.id);

    // ✅ Parse Query Parameters
    const url = new URL(request.url);
    console.log("\n\n===== NEW API REQUEST =====");
    console.log("Incoming query params:", Object.fromEntries(url.searchParams.entries()));
    const groupId = url.searchParams.get('groupId');
    const eventId = url.searchParams.get('eventId');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');

    // ✅ Find Leader & Validate Group
    const leader = await User.findById(leaderId).populate<{ group: IGroup }>('group');
    if (!leader || !leader.group) {
      return NextResponse.json({ error: 'Leader or group not found' }, { status: 404 });
    }

    const leaderGroupId = leader.group._id.toString();

    // ✅ Restrict access to leader's own group only
    if (groupId && groupId !== leaderGroupId) {
      return NextResponse.json({ error: 'Invalid group filter' }, { status: 403 });
    }

    // ✅ Validate optional eventId format
    if (eventId && !mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    // ✅ Prepare Attendance Filter
    const attendanceFilter: FilterQuery<IAttendance> = {
      group: leader.group._id
    };

    if (eventId) {
      attendanceFilter.event = new mongoose.Types.ObjectId(eventId);
    }

    if (fromDate || toDate) {
      const dateFilter: { $gte?: Date; $lte?: Date } = {};
      if (fromDate) dateFilter.$gte = new Date(fromDate);
      if (toDate) dateFilter.$lte = new Date(toDate);
      attendanceFilter.date = dateFilter;
    }

    // ✅ Fetch in parallel
    const [attendanceRecords, events, rawMembers] = await Promise.all([
      Attendance.find(attendanceFilter).lean<IAttendance[]>(),
      Event.find({ group: leader.group._id }).lean(),
      User.find({ group: leader.group._id, role: 'member' })
        .select('name email phone')
        .lean<IUser[]>()
    ]);

    // ✅ Format members
    const members: Member[] = rawMembers.map(member => ({
      _id: member._id,
      name: member.name,
      email: member.email,
      phone: member.phone,
    }));

    // ✅ Initialize attendance map
    const memberStats = new Map<string, { count: number; lastDate: Date | null }>();
    members.forEach(m => memberStats.set(m._id.toString(), { count: 0, lastDate: null }));

    // ✅ Populate attendance stats
    for (const record of attendanceRecords) {
      for (const memberId of record.presentMembers) {
        const id = memberId.toString();
        const stats = memberStats.get(id);
        if (stats) {
          stats.count += 1;
          if (!stats.lastDate || record.date > stats.lastDate) {
            stats.lastDate = record.date;
          }
        }
      }
    }

    // ✅ Final enhanced member list
    const enhancedMembers: EnhancedMember[] = members.map(m => {
      const data = memberStats.get(m._id.toString());
      const attendanceCount = data?.count ?? 0;
      const lastAttendanceDate = data?.lastDate ?? null;

      const rating: EnhancedMember['rating'] =
        attendanceCount > 10 ? 'Excellent' :
        attendanceCount > 5 ? 'Average' : 'Poor';

      return {
        ...m,
        attendanceCount,
        lastAttendanceDate,
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
    return NextResponse.json({ error: 'Failed to fetch data', details: error }, { status: 500 });
  }
}