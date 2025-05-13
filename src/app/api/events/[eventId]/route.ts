// src/app/api/events/[eventId]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/dbConnect'
import { Event } from '@/lib/models/Event'

export async function GET(
    request: Request,
    { params }: { params: { eventId: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    try {
        const event = await Event.findById(params.eventId).populate('group', 'name')
        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 })
        }

        // Verify the user has access to this event
        if (event.createdBy.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        return NextResponse.json({
            event: {
                _id: event._id.toString(),
                title: event.title,
                date: event.date.toISOString(),
                description: event.description,
                groupId: event.group._id.toString(),
                group: {
                    _id: event.group._id.toString(),
                    name: event.group.name
                },
                createdBy: event.createdBy.toString()
            }
        })
    } catch (error) {
        console.error('Error fetching event:', error)
        return NextResponse.json(
            { error: 'Failed to fetch event' },
            { status: 500 }
        )
    }
}