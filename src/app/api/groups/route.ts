// src/app/api/groups/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect'; // Adjust the import path as necessary
import { Group } from '@/lib/models/Group'; // Adjust the import path as necessary

// ➕ CREATE a group
export async function POST(request: Request) {
    try {
        const { name } = await request.json(); // Get the group name from the request body
        await dbConnect(); // Connect to the database

        const group = new Group({ name }); // Create a new group instance
        await group.save(); // Save the group to the database

        return NextResponse.json({ success: true, group }); // Return the created group
    } catch (error) {
        console.error('Error creating group:', error);
        return NextResponse.json({ success: false, error: 'Failed to create group' }, { status: 500 });
    }
}

// 📄 LIST all groups
export async function GET() {
    try {
        await dbConnect(); // Connect to the database
        const groups = await Group.find(); // Fetch all groups from the database
        return NextResponse.json({ success: true, groups }); // Return the list of groups
    } catch (error) {
        console.error('Error fetching groups:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch groups' }, { status: 500 });
    }
}
