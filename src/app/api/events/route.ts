// src/app/api/events/route.ts
import { NextResponse } from 'next/server'
import  Event  from '@/lib/models/Event'
import  Group  from '@/lib/models/Group'
import { User } from '@/lib/models/User'
import dbConnect from '@/lib/dbConnect'


export async function GET(request: Request) {

    await dbConnect()
    const url = new URL(request.url)
  const page = Number(url.searchParams.get('page')) || 1
  const limit = Number(url.searchParams.get('limit')) || 10
  const groupId = url.searchParams.get('groupId') || undefined
  const startDate = url.searchParams.get('startDate')
  const endDate = url.searchParams.get('endDate')

  const filter: any = {}

  if (groupId) filter.group = groupId
    if (startDate || endDate) {
        filter.date = {}
        if (startDate) filter.date.$gte = new Date(startDate)
        if (endDate) filter.date.$lte = new Date(endDate)
    }
    const skip = (page - 1) * limit

    const events = await Event.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean()

        const total = await Event.countDocuments(filter)
        // For each event, fetch attendance count
        // Attendance is stored in event.attendance as array of member IDs or similar

        const eventsWithAttendance = await Promise.all(events.map(async (event) => {
            // Example: attendance count = event.attendance.length
            const attendanceCount = event.attendance ? event.attendance.length : 0
            return { ...event, attendanceCount }
        }))

    return NextResponse.json({
        events: eventsWithAttendance,
        total,
        page,
        limit,
    })
}