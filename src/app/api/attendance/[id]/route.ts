// src/app/api/attendance/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/dbConnect'
import { Attendance, IAttendance } from '@/lib/models/Attendance'
import { Group } from '@/lib/models/Group'

interface AttendanceRequest {
    date: string
    groupId: string
    eventId?: string // Make eventId optional for backward compatibility
    presentIds: string[]
}

export async function POST(request: Request) {
    try {
        // Verify authentication
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Validate request body
        const { date, groupId, eventId, presentIds }: AttendanceRequest = await request.json()

        if (!date || !groupId || !presentIds) {
            return NextResponse.json(
                { error: 'Date, group ID and present IDs are required' },
                { status: 400 }
            )
        }

        // Validate date format
        const attendanceDate = new Date(date)
        if (isNaN(attendanceDate.getTime())) {
            return NextResponse.json(
                { error: 'Invalid date format' },
                { status: 400 }
            )
        }

        await dbConnect()

        // Verify group exists and user is leader
        const group = await Group.findById(groupId)
        if (!group) {
            return NextResponse.json(
                { error: 'Group not found' },
                { status: 404 }
            )
        }

        if (group.leader.toString() !== session.user.id) {
            return NextResponse.json(
                { error: 'Only group leaders can record attendance' },
                { status: 403 }
            )
        }

        // Validate all present IDs are group members
        const invalidMembers = presentIds.filter(id =>
            !group.members.some((memberId: string) => memberId.toString() === id)
        )
        if (invalidMembers.length > 0) {
            return NextResponse.json(
                {
                    error: `Invalid members: ${invalidMembers.join(', ')}`,
                    validMembers: group.members.map((memberId: string) => memberId.toString())
                },
                { status: 400 }
            )
        }

        // Check for existing attendance record
        const existingAttendance = await Attendance.findOne({
            date: attendanceDate,
            group: groupId
        })
        if (existingAttendance) {
            return NextResponse.json(
                { error: 'Attendance already recorded for this date' },
                { status: 400 }
            )
        }

        // Calculate absent members (those in group but not in presentIds)
        const absentMemberIds = group.members
            .map((id: string) => id.toString())
            .filter((id: string) => !presentIds.includes(id))

        // Create new attendance record
        const attendance = new Attendance({
            event: eventId || group._id, // Use group ID as fallback if eventId not provided
            group: groupId,
            date: attendanceDate,
            presentMembers: presentIds,
            absentMembers: absentMemberIds,
            recordedBy: session.user.id,
            notes: '' // Optional empty notes
        }) as IAttendance;

        await attendance.save()

        const attendanceObject = attendance.toObject();

        return NextResponse.json({
            message: 'Attendance recorded successfully',
            data: {
                id: attendanceObject._id.toString(),
                date: attendance.date.toISOString().split('T')[0],
                group: group.name,
                presentCount: attendance.presentMembers.length,
                absentCount: attendance.absentMembers.length,
                attendancePercentage: attendance.getAttendancePercentage ?
                    attendance.getAttendancePercentage() :
                    (attendance.presentMembers.length / (attendance.presentMembers.length + attendance.absentMembers.length) * 100)
            }
        }, { status: 201 })

    } catch (error) {
        console.error('Attendance recording error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}