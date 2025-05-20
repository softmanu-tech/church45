// app/api/leader/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { Group } from '@/lib/models/Group'; // Now properly used
import { Attendance } from '@/lib/models/Attendance';
import { requireSessionAndRoles } from "@/lib/authMiddleware";
import mongoose, { FilterQuery } from 'mongoose';

// ... (keep your existing interfaces)

export async function GET(request: Request) {
  try {
    await dbConnect();

    // Authentication & get leader
    const { user } = await requireSessionAndRoles(request, ['leader']);
    const leader = await User.findById(user.id).populate<{ group: InstanceType<typeof Group> }>('group');
    
    if (!leader?.group) {
      return NextResponse.json({ error: 'Leader group not found' }, { status: 404 });
    }

    // Get the full group document with members
    const group = await Group.findById(leader.group._id)
      .populate('members', 'name email phone')
      .populate('leader', 'name email');

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Rest of your existing data fetching logic
    const { searchParams } = new URL(request.url);
    // ... (keep your existing filter logic)

    return NextResponse.json({
      group: {
        _id: group._id.toString(),
        name: group.name,
        members: group.members, // Now using actual group members
        leader: group.leader
      },
      // ... rest of your response
    });

  } catch (error) {
    console.error('Leader API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Add member to group
export async function POST(request: Request) {
  try {
    await dbConnect();
    const { user } = await requireSessionAndRoles(request, ['leader']);
    
    // Get leader's group
    const leader = await User.findById(user.id).populate('group');
    if (!leader?.group) {
      return NextResponse.json({ error: 'Leader group not found' }, { status: 404 });
    }

    const { memberId } = await request.json();
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 });
    }

    // Add member to group
    const updatedGroup = await Group.findByIdAndUpdate(
      leader.group._id,
      { $addToSet: { members: memberId } },
      { new: true, runValidators: true }
    ).populate('members', 'name email');

    return NextResponse.json({
      message: 'Member added successfully',
      group: updatedGroup
    });

  } catch (error) {
    console.error('Add member error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add member' },
      { status: 500 }
    );
  }
}

// Remove member from group
export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const { user } = await requireSessionAndRoles(request, ['leader']);
    
    const leader = await User.findById(user.id).populate('group');
    if (!leader?.group) {
      return NextResponse.json({ error: 'Leader group not found' }, { status: 404 });
    }

    const { memberId } = await request.json();
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 });
    }

    // Remove member from group
    const updatedGroup = await Group.findByIdAndUpdate(
      leader.group._id,
      { $pull: { members: memberId } },
      { new: true }
    ).populate('members', 'name email');

    return NextResponse.json({
      message: 'Member removed successfully',
      group: updatedGroup
    });

  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove member' },
      { status: 500 }
    );
  }
}

// 2. Get Leader with Group
const leader = await User.findById(user.id).populate<{ group: IGroup }>('group');
if (!leader?.group) {
  return NextResponse.json({ error: 'Leader group not found' }, { status: 404 });
}


