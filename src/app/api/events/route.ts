// src/app/api/events/route.ts
import { NextResponse } from 'next/server'
import { Event } from '@/lib/models/Event'
import { Group } from '@/lib/models/Group'
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

  const filter: unknown = {}

  if (groupId) filter.group = groupId
    if (startDate || endDate) {
        filter.date = {}
        if (startDate) filter.date.$gte = new Date(startDate)
        if (endDate) filter.date.$lte = new Date(endDate)
    }
    const skip = (page - 1) * limit



    try {
        // Verify the group exists and the user is its leader
        const group = await Group.findById(groupId)
        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 })
        }

        // Create the event
        const newEvent = new Event({
            title,
            date: new Date(date),
            description,
            group: groupId,
            createdBy: session.user.id
        })

        await newEvent.save()

        return NextResponse.json({
            _id: newEvent._id.toString(),
            title: newEvent.title,
            date: newEvent.date.toISOString(),
            description: newEvent.description,
            groupId: newEvent.group.toString(),
            createdBy: newEvent.createdBy.toString()
        })

    } catch (error) {
        console.error('Error creating event:', error)
        return NextResponse.json(
            { error: 'Failed to create event' },
            { status: 500 }
        )
    }
}