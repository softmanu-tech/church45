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

    // 3. Parse and Validate Filters
    const { searchParams } = new URL(request.url);
    
    const eventId = searchParams.get('eventId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const group = await Group.findById(leader.group._id);
    


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