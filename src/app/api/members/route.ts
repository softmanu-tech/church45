// src/app/api/members/route.ts
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import { User } from '@/lib/models/User'
import { Group, IGroup } from '@/lib/models/Group'
import { requireSessionAndRoles } from '@/lib/authMiddleware'

export async function POST(request: Request) {
    try {
        await dbConnect()
        const { name, email, phone, department, location, groupId, role, password, leader } = await request.json()

        // Validate groupId
        const group = await Group.findById(groupId)
        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 })
        }

        const { user } = await requireSessionAndRoles(request, ['leader'])
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const leader = await User.findById(user.id).populate<{ group: IGroup }>('group');
        if (!leader?.group) {
            return NextResponse.json({ error: 'Leader group not found' }, { status: 404 });
        }

        // Check for required fields
        if (!name || !email || !groupId || !role || !department || !location || !password || !leader) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            )
        }

        const newMember = new User({
            name,
            email,
            phone,
            department,
            location,
            group: groupId, // Use the selected groupId from the form
            role, 
            password ,
            leader
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
