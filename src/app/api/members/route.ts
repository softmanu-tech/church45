// src/app/api/members/route.ts
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/dbConnect'
import Member, { IMember } from '@/lib/models/Member'
import { Group, IGroup } from '@/lib/models/Group'
import { requireSessionAndRoles } from '@/lib/authMiddleware'
import bcrypt from 'bcrypt'

export async function POST(request: Request) {
  try {
    await dbConnect()

    // Parse incoming JSON body
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

    // Require session & leader role
    const { user } = await requireSessionAndRoles(request, ['leader'])
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate presence of required fields
    if (!name || !email || !groupId || !role || !location || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Fetch group and populate leader
    const group = await Group.findById(groupId).populate<{ leader: IGroup['leader'] }>('leader')
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }
    if (!group.leader) {
      return NextResponse.json({ error: 'Group leader not set' }, { status: 400 })
    }

    // Hash password securely
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new member object
    const newMemberData: Partial<IMember> = {
      name,
      email,
      phone,
      department,
      location,
      group: group._id,
      role,
      password: hashedPassword,
      leader: (group.leader as mongoose.Types.ObjectId),
    }

    const newMember = new Member(newMemberData)
    await newMember.save()

    // Add member id to group's members array
    group.members.push(newMember._id)
    await group.save()

    // Return member data with _id and leader as strings
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
