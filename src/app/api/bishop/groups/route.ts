import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Group } from '@/lib/models/Group';

// ➕ CREATE a group
export async function POST(req: Request) {
    try {
        const { name } = await req.json();
        await dbConnect();

        const group = new Group({ name });
        await group.save();

        return NextResponse.json({ success: true, group });
    } catch (error) {
        return NextResponse.json({ success: false, error }, { status: 500 });
    }
}

// 📄 LIST all groups
export async function GET() {
    try {
        await dbConnect();
        const groups = await Group.find();
        return NextResponse.json({ success: true, groups });
    } catch (error) {
        return NextResponse.json({ success: false, error }, { status: 500 });
    }
}
