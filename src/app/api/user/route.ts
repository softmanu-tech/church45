// app/api/user/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { requireSessionAndRoles } from "@/lib/authMiddleware";

export async function GET(request: Request) {
  try {
    await dbConnect();

    // 1. Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['user']); // Adjust role as needed
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch User Data
    const fetchedUser  = await User.findById(user.id).select('name email phone group').lean();
    if (!fetchedUser ) {
      return NextResponse.json({ error: 'User  not found' }, { status: 404 });
    }

    // 3. Return User Data
    return NextResponse.json(fetchedUser );

  } catch (error) {
    console.error('User  API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Update User
export async function POST(request: Request) {
  try {
    await dbConnect();

    // 1. Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['user']); // Adjust role as needed
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and Validate Request Body
    const { name, email, phone } = await request.json();
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // 3. Update User Data
    const updatedUser  = await User.findByIdAndUpdate(
      user.id,
      { name, email, phone },
      { new: true }
    );

    if (!updatedUser ) {
      return NextResponse.json({ error: 'User  not found' }, { status: 404 });
    }

    // 4. Return Success Response
    return NextResponse.json({ message: 'User  updated successfully', user: updatedUser  });

  } catch (error) {
    console.error('User  API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove User
export async function DELETE(request: Request) {
  try {
    await dbConnect();

    // 1. Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['user']); // Adjust role as needed
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Find and Delete User
    const deletedUser  = await User.findByIdAndDelete(user.id);
    if (!deletedUser ) {
      return NextResponse.json({ error: 'User  not found' }, { status: 404 });
    }

    // 3. Return Success Response
    return NextResponse.json({ message: 'User  removed successfully' });

  } catch (error) {
    console.error('User  API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
