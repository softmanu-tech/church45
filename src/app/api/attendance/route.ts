// src/app/api/attendance/route.ts
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import { Attendance, IAttendance } from '@/lib/models/Attendance'
import Group, { IGroup } from '@/lib/models/Group'
import { Types } from 'mongoose'
import { requireSessionAndRole } from '@/lib/auth/requireSessionAndRole'

interface AttendanceRequest {
  date: string
  groupId: string
  presentIds: string[]
}

export async function POST(request: Request) {
  try {
    const session = await requireSessionAndRole(['leader']) // Assuming leader role is required

    const { date, groupId, presentIds }: AttendanceRequest = await request.json()

    if (!date || !groupId || !Array.isArray(presentIds)) {
      return NextResponse.json(
        { error: 'Date, group ID, and present IDs array are required' },
        { status: 400 }
      )
    }

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

    attendanceDate.setHours(0, 0, 0, 0)

    await dbConnect()

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

    const presentObjectIds = presentIds.map(id => new Types.ObjectId(id))
    const groupMemberIds = new Set(group.members.map(memberId => memberId.toString()))
    const invalidMembers = presentIds.filter(id => !groupMemberIds.has(id))

    if (invalidMembers.length > 0) {
      return NextResponse.json(
        { error: `Invalid members: ${invalidMembers.join(', ')}` },
        { status: 400 }
      )
    }

    const existingAttendance = await Attendance.findOne({
      date: attendanceDate,
      group: group._id
    }).exec()

    if (existingAttendance) {
      existingAttendance.presentMembers = presentObjectIds
      existingAttendance.updatedBy = new Types.ObjectId(session.user.id)
      existingAttendance.updatedAt = new Date()

      await existingAttendance.save()

      return NextResponse.json({
        message: 'Attendance updated successfully',
        data: {
          id: existingAttendance._id.toString(),
          date: existingAttendance.date.toISOString().split('T')[0],
          group: group.name,
          presentCount: existingAttendance.presentMembers.length,
          absentCount: group.members.length - presentObjectIds.length,
          updated: true
        }
      })
    }

    const attendance = new Attendance({
      date: attendanceDate,
      group: group._id,
      presentMembers: presentObjectIds,
      absentMembers: group.members.filter(memberId => !presentIds.includes(memberId.toString())),
      recordedBy: new Types.ObjectId(session.user.id),
      updatedBy: new Types.ObjectId(session.user.id),
      notes: '',
    })

    await attendance.save()

    return NextResponse.json(
      {
        message: 'Attendance recorded successfully',
        data: {
          id: attendance._id.toString(),
          date: attendance.date.toISOString().split('T')[0],
          group: group.name,
          presentCount: attendance.presentMembers.length,
          absentCount: group.members.length - presentObjectIds.length,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Attendance POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
