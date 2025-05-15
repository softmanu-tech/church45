// app/api/bishop/dashboard/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import Group from '@/lib/models/Group';
import { Attendance } from '@/lib/models/Attendance';
import { requireSessionAndRole } from '@/lib/authMiddleware';

export async function GET(request: Request) {
  const roleCheck = await requireSessionAndRole(request, "bishop");
  if (roleCheck instanceof Response) return roleCheck;

  try {
    await dbConnect();

    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    let dateFilter = {};
    if (from || to) {
      dateFilter = {
        date: {
          ...(from ? { $gte: new Date(from) } : {}),
          ...(to ? { $lte: new Date(to) } : {}),
        },
      };
    }

    const [leadersCount, groupsCount, membersCount, attendanceRecords] = await Promise.all([
      User.countDocuments({ role: 'leader' }),
      Group.countDocuments(),
      User.countDocuments({ role: 'member' }),
      Attendance.find(dateFilter).lean()
    ]);

    const totalAttendance = attendanceRecords.reduce(
      (sum, record) => sum + (record.presentMembers?.length || 0),
      0
    );

    return NextResponse.json({
      stats: {
        leaders: leadersCount,
        groups: groupsCount,
        members: membersCount,
        totalAttendance,
      },
      filter: { from, to },
    });
  } catch (error) {
    console.error('Error fetching bishop dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
