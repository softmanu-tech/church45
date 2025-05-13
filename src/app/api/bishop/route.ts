import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { Group } from '@/lib/models/Group';
import { Attendance } from '@/lib/models/Attendance';

export async function GET() {
    try {
        await dbConnect();

        const leadersCount = await User.countDocuments({ role: 'leader' });
        const groupsCount = await Group.countDocuments();
        const membersCount = await User.countDocuments({ role: 'member' });

        // Calculate total attendance
        const attendanceRecords = await Attendance.find({}).lean();
        const totalAttendance = attendanceRecords.reduce(
            (sum, record) => sum + (record.presentMembers?.length || 0),
            0
        );

        return NextResponse.json({
            leaders: leadersCount,
            groups: groupsCount,
            members: membersCount,
            totalAttendance,
        });
    } catch (error) {
        console.error('Error fetching bishop dashboard stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard stats' },
            { status: 500 }
        );
    }
}
