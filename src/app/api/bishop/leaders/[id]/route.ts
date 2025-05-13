import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models/User';

// ✏️ UPDATE a leaders
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const { name, email, group } = await req.json();
        await dbConnect();

        const updatedLeader = await User.findByIdAndUpdate(
            params.id,
            { name, email, group },
            { new: true }
        );

        return NextResponse.json({ success: true, leader: updatedLeader });
    } catch (error) {
        console.log(error)
        return NextResponse.json({ success: false, error}, { status: 500 });
    }
}

// DELETE a leaders
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        await User.findByIdAndDelete(params.id);
        return NextResponse.json({ success: true, message: 'Leader deleted' });
    } catch (error) {
        console.log(error)
        return NextResponse.json({ success: false, error }, { status: 500 });
    }
}
