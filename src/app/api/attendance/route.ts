// src/app/api/attendance/route.ts
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import { Attendance, IAttendance } from '@/lib/models/Attendance'
import Group, { IGroup } from '@/lib/models/Group'
import { Types } from 'mongoose'

interface AttendanceRequest {
  date: string
  groupId: string
  presentIds: string[]
}

export async function POST(request: Request) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const { date, groupId, presentIds }: AttendanceRequest = await request.json()
    if (!date || !groupId || !Array.isArray(presentIds)) {
      return NextResponse.json(
        { error: 'Date, group ID, and present IDs array are required' },
        { status: 400 }
      )
    }

    // Validate date format and range
    const attendanceDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (isNaN(attendanceDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD format.' },
        { status: 400 }
      )
    }

    if (attendanceDate > today) {
      return NextResponse.json(
        { error: 'Cannot record attendance for future dates' },
        { status: 400 }
      )
    }

    // Set time to midnight for consistent comparison
    attendanceDate.setHours(0, 0, 0, 0)

    // Connect to the database
    await dbConnect()

    // Verify group existence and user authorization
    const group = await Group.findById(groupId).exec() as (IGroup & { _id: Types.ObjectId }) | null
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (!group.leader || group.leader.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Only group leaders can record attendance' },
        { status: 403 }
      )
    }

    // Convert presentIds to ObjectIds
    const presentObjectIds = presentIds.map(id => new Types.ObjectId(id))

    // Validate present IDs against group members
    const groupMemberIds = new Set(group.members.map(memberId => memberId.toString()))
    const invalidMembers = presentIds.filter(id => !groupMemberIds.has(id))
    if (invalidMembers.length > 0) {
      return NextResponse.json(
        { error: `Invalid members: ${invalidMembers.join(', ')}` },
        { status: 400 }
      )
    }

    // Check for existing attendance record
    const existingAttendance = await Attendance.findOne({
      date: attendanceDate,
      group: groupId
    }).exec() as (IAttendance & { _id: Types.ObjectId }) | null

    if (existingAttendance) {
      // Update existing attendance if found
      existingAttendance.presentMembers = presentObjectIds
      existingAttendance.presentCount = presentObjectIds.length
      existingAttendance.absentCount = group.members.length - presentObjectIds.length
      existingAttendance.updatedBy = new Types.ObjectId(session.user.id)
      existingAttendance.updatedAt = new Date()

      await existingAttendance.save()

      return NextResponse.json({
        message: 'Attendance updated successfully',
        data: {
          id: existingAttendance._id.toString(),
          date: existingAttendance.date.toISOString().split('T')[0],
          group: group.name,
          presentCount: existingAttendance.presentCount,
          absentCount: existingAttendance.absentCount,
          updated: true
        }
      })
    }

    // Create new attendance record
    const attendance = new Attendance({
      date: attendanceDate,
      group: new Types.ObjectId(groupId),
      presentCount: presentObjectIds.length,
      absentCount: group.members.length - presentObjectIds.length,
      presentMembers: presentObjectIds,
      recordedBy: new Types.ObjectId(session.user.id),
      updatedBy: new Types.ObjectId(session.user.id),
      updatedAt: new Date()
    }) as IAttendance & { _id: Types.ObjectId }

    await attendance.save()

    // Convert the document to a plain object to include virtuals
    const attendanceObject = attendance.toObject()

    // Respond with success
    return NextResponse.json(
      {
        message: 'Attendance recorded successfully',
        data: {
          id: attendanceObject._id.toString(),
          date: attendance.date.toISOString().split('T')[0],
          group: group.name,
          presentCount: attendance.presentCount,
          absentCount: attendance.absentCount
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Attendance recording error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}