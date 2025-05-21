// src/app/api/members/route.ts
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import { User } from '@/lib/models/User'
import { Group, IGroup } from '@/lib/models/Group'
import { requireSessionAndRoles } from '@/lib/authMiddleware'

export async function POST(request: Request) {
try {
    await dbConnect()

    const {user} = await requireSessionAndRoles(request, ['leader'])
    if (!user?.id){
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const leader = await User.findById(user.id).populate<{ group: IGroup }>('group');
    if (!leader?.group) {
      return NextResponse.json({ error: 'Leader group not found' }, { status: 404 });
    }

    const { name, email, phone, department, location, groupId, role } = await request.json()

    if (!name || !email || !groupId || !role || !department || !location) {
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
        group: leader.group._id,
        role: 'member'
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

    return NextResponse.json({ message: 'Member added successfully', member: newMember });
} catch (error) {
    
}

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