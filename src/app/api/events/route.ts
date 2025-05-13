// src/app/api/events/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/dbConnect'
import { Event } from '@/lib/models/Event'
import { Group } from '@/lib/models/Group'

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, date, description, groupId } = await request.json()

    if (!title || !date || !groupId) {
        return NextResponse.json(
            { error: 'Title, date and group ID are required' },
            { status: 400 }
        )
    }

    await dbConnect()

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