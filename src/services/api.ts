import { requireSessionAndRole } from "@/lib/authMiddleware";
import { NextResponse } from "next/server";
import { Group } from "@/lib/models/Group";

export async function GET(req: Request) {
  try {
    const { user } = await requireSessionAndRole(req, "leader");

    if (!user._id) {
      throw new Error("Invalid or missing userId");
    }

    const groups = await Group.find({ leader: user._id });

    return NextResponse.json({ groups });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
