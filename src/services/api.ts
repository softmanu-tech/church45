import { requireSessionAndRole } from "@/lib/authMiddleware";

export async function GET(req: Request) {
  try {
    const { user } = await requireSessionAndRole(req, "leader");

    // You can now access user._id (which is a real ObjectId)
    const groups = await Group.find({ leader: user._id });

    return NextResponse.json({ groups });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
