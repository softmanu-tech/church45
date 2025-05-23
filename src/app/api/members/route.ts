import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/dbConnect'
import Member from '@/lib/models/Member'
import { Group } from '@/lib/models/Group'
import { requireSessionAndRoles } from '@/lib/authMiddleware'
import bcrypt from 'bcrypt'

export async function POST(request: Request) {
  try {
    await dbConnect()

    const {
      name,
      email,
      phone,
      department,
      location,
      groupId,
      role,
      password,
    }: {
      name: string
      email: string
      phone?: string
      department?: string
      location: string
      groupId: string
      role: string
      password: string
    } = await request.json()

    // Verify logged-in user with 'leader' role
    const { user } = await requireSessionAndRoles(request, ['leader'])
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate required fields
    if (!name || !email || !groupId || !role || !location || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Fetch the group by ID
    const group = await Group.findById(groupId)
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Update group's leader to be the user creating the member
    if (!group.leader || group.leader.toString() !== user.id) {
      group.leader = new mongoose.Types.ObjectId(user.id)
      await group.save()
    }

    // Hash password securely
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create the new member, assigning the leader as the user creating the member
    const newMember = new Member({
      name,
      email,
      phone,
      department,
      location,
      group: group._id,
      role,
      password: hashedPassword,
      leader: new mongoose.Types.ObjectId(user.id),
    })

    await newMember.save()

    // Add the new member to group's members array
    group.members.push(newMember._id)
    await group.save()

    return NextResponse.json({
      _id: newMember._id.toString(),
      name: newMember.name,
      email: newMember.email,
      phone: newMember.phone,
      department: newMember.department,
      location: newMember.location,
      role: newMember.role,
      leader: newMember.leader.toString(),
    })
  } catch (error) {
    console.error('Error adding member:', error)
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
  }
}
