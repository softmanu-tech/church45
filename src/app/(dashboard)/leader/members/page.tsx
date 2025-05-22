// src/app/api/members/route.ts
import { NextResponse } from 'next/server';
import Member from '@/models/Member'; // Adjust the import based on your file structure

export async function POST(request: Request) {
    try {
        const { name, email, phone, department, location, group, role, password, leader } = await request.json();

        // Validate required fields
        if (!name || !email || !group || !role || !password || !leader) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        // Create a new member
        const member = new Member({
            name,
            email,
            phone,
            department,
            location,
            group,
            role,
            password, // Ensure you hash the password before saving
            leader,
        });

        await member.save();

        return NextResponse.json({ success: true, member });
    } catch (error) {
        console.error('Error adding member:', error);
        return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
    }
}
