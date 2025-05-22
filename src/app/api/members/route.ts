import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/dbConnect'
import Member, { IMember } from '@/lib/models/Member'
import { Group, IGroup } from '@/lib/models/Group'
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

    // Validate group existence with populated leader (IGroup interface includes leader: IUser or ObjectId)
    const group = await Group.findById(groupId).populate('leader')
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Require leader to be set on group
    if (!group.leader) {
      return NextResponse.json({ error: 'Leader not set on group' }, { status: 400 })
    }

    // Validate required fields (adjust as needed)
    if (!name || !email || !groupId || !role || !location || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newMemberData: Partial<IMember> = {
      name,
      email,
      phone,
      department,
      location,
      group: group._id,
      role,
      password: hashedPassword,
      leader: (group.leader as any)._id || group.leader, // leader._id if populated else leader ObjectId
    }

    // Create new member instance
    const newMember = new Member(newMemberData)

    await newMember.save()

    // Push newMember to group's members
    group.members.push(newMember._id)
    await group.save()

    // Cast newMember._id explicitly to ObjectId to fix unknown error and convert to string
    const memberId = newMember._id as mongoose.Types.ObjectId

    return NextResponse.json({
      _id: memberId.toString(),
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
