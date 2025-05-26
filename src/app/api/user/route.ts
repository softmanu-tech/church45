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


///////////////////////////////////////////////////////////////
// app/api/user/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';
import { requireSessionAndRoles } from "@/lib/authMiddleware";
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    await dbConnect();

    // 1. Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['admin', 'leader']); // Allow both admin and leader roles
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch User Details
    const fetchedUser  = await User.findById(user.id).lean();
    if (!fetchedUser ) {
      return NextResponse.json({ error: 'User  not found' }, { status: 404 });
    }

    // 3. Return User Details
    return NextResponse.json(fetchedUser );

  } catch (error) {
    console.error('User  API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Create User
export async function POST(request: Request) {
  try {
    await dbConnect();

    // 1. Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['admin']); // Only admin can create users
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and Validate Request Body
    const { name, email, phone, role } = await request.json();
    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 });
    }

    // 3. Create New User
    const newUser  = new User({
      name,
      email,
      phone,
      role
    });

    await newUser .save();

    // 4. Return Success Response
    return NextResponse.json({ message: 'User  created successfully', user: newUser  });

  } catch (error) {
    console.error('User  API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PUT: Update User
export async function PUT(request: Request) {
  try {
    await dbConnect();

    // 1. Strict Authentication
    const { user } = await requireSessionAndRoles(request, ['admin']); // Only admin can update users
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and Validate Request Body
    const { userId, name, email, phone, role } = await request.json();
    if (!userId || !name || !email) {
      return NextResponse.json({ error: 'User  ID, name, and email are required' }, { status: 400 });
    }

    // 3. Find and Update User
    const updatedUser  = await User.findByIdAndUpdate(
      userId,
      { name, email, phone, role },
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
    const { user } = await requireSessionAndRoles(request, ['admin']); // Only admin can delete users
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and Validate Request Body
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'User  ID is required' }, { status: 400 });
    }

    // 3. Find and Delete User
    const deletedUser  = await User.findByIdAndDelete(userId);

    if (!deletedUser ) {
      return NextResponse.json({ error: 'User  not found' }, { status: 404 });
    }

    // 4. Return Success Response
    return NextResponse.json({ message: 'User  removed successfully' });

  } catch (error) {
    console.error('User  API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
