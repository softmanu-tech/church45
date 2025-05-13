import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';

import bcrypt from 'bcrypt';

// ➕ CREATE a leaders and assign to a groups
export async function POST(req: Request) {
    try {
        const { name, email, password, groupId } = await req.json();
        await dbConnect();

        const hashedPassword = await bcrypt.hash(password, 10);

        const leader = new User({
            name,
            email,
            password: hashedPassword,
            role: 'leader',
            group: groupId,
        });
        await leader.save();

        return NextResponse.json({ success: true, leader });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ success: false, error }, { status: 500 });
    }
}

// 📄 LIST all leaders
export async function GET() {
    try {
        await dbConnect();
        const leaders = await User.find({ role: 'leader' }).populate('group');
        return NextResponse.json({ success: true, leaders });
    } catch (error) {
        return NextResponse.json({ success: false, error }, { status: 500 });
    }
}
