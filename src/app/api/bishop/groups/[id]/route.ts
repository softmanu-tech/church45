import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { Group } from '@/lib/models/Group';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const { name } = await req.json();
        await dbConnect();

        const updatedGroup = await Group.findByIdAndUpdate(params.id, { name }, { new: true });
        return NextResponse.json({ success: true, group: updatedGroup });
    } catch (error) {
        return NextResponse.json({ success: false, error}, { status: 500 });
    }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        await Group.findByIdAndDelete(params.id);
        return NextResponse.json({ success: true, message: 'Group deleted' });
    } catch (error) {
        return NextResponse.json({ success: false, error}, { status: 500 });
    }
}
