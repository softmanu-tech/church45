// src/app/api/members/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import dbConnect from '@/lib/dbConnect'
import { User } from '@/lib/models/User'
import { Group } from '@/lib/models/Group'
import { requireSessionAndRoles } from '@/lib/authMiddleware'

export async function POST(request: Request) {
    const {user} = await requireSessionAndRoles(request, ['leader'])
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, email, phone, groupId, role } = await request.json()

    if (!name || !email || !groupId || !role) {
        return NextResponse.json(
            { error: 'All fields are required' },
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

        if (group.leader.toString() !== session.user.id) {
            return NextResponse.json(
                { error: 'Only the group leader can add members' },
                { status: 403 }
            )
        }


        // Create the member
        const newMember = new User({
            name,
            email,
            phone,
            group: groupId,
            role
        })

        await newMember.save()

        // Add member to group
        group.members.push(newMember._id)
        await group.save()

        return NextResponse.json({
            _id: newMember._id.toString(),
            name: newMember.name,
            email: newMember.email,
            phone: newMember.phone
        })

    } catch (error) {
        console.error('Error adding member:', error)
        return NextResponse.json(
            { error: 'Failed to add member' },
            { status: 500 }
        )
    }
}