// src/app/api/members/route.ts
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Member from '@/lib/models/Member' // Ensure you import the Member model
import { Group } from '@/lib/models/Group'
import { requireSessionAndRoles } from '@/lib/authMiddleware'
import bcrypt from 'bcrypt' // Import bcrypt for password hashing

export async function POST(request: Request) {
    try {
        await dbConnect()
        const { name, email, phone, department, location, groupId, role, password } = await request.json()

        // Validate groupId
        const group = await Group.findById(groupId)
        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 })
        }

        const { user } = await requireSessionAndRoles(request, ['leader'])
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check for required fields
        if (!name || !email || !groupId || !role || !department || !location || !password) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            )
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create a new member
        const newMember = new Member({
            name,
            email,
            phone,
            department,
            location,
            group: groupId, // Use the selected groupId from the form
            role,
            password: hashedPassword, // Save the hashed password
            leader: user.id // Assign the leader from the session
        })

        await newMember.save()

        // Add member to group
        group.members.push(newMember._id)
        await group.save()

        return NextResponse.json({
            _id: newMember._id.toString(), // Include the member ID
            name: newMember.name,
            email: newMember.email,
            phone: newMember.phone,
            department: newMember.department,
            location: newMember.location,
            role: newMember.role,
            leader: newMember.leader.toString() // Convert leader ID to string
        })
        
    } catch (error) {
        console.error('Error adding member:', error)
        return NextResponse.json(
            { error: 'Failed to add member' },
            { status: 500 }
        )
    }
}
