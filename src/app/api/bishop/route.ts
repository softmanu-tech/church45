// app/api/bishop/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { requireSessionAndRole } from "@/lib/authMiddleware";
import { User } from "@/lib/models/User";
import Group from "@/lib/models/Group";
import { Attendance } from "@/lib/models/Attendance";

export async function GET(req: NextRequest) {
  const auth = await requireSessionAndRole(req, "bishop");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let dateFilter = {};
    if (from || to) {
      dateFilter = {
        date: {
          ...(from ? { $gte: new Date(from) } : {}),
          ...(to ? { $lte: new Date(to) } : {}),
        },
      };
    }

    const [leadersCount, groupsCount, membersCount, attendanceRecords] = await Promise.all([
      User.countDocuments({ role: "leader" }),
      Group.countDocuments(),
      User.countDocuments({ role: "member" }),
      Attendance.find(dateFilter).lean(),
    ]);

    const totalAttendance = attendanceRecords.reduce(
      (sum, record) => sum + (record.presentMembers?.length || 0),
      0
    );

    // Group-level breakdown

    return NextResponse.json({
      stats: {
        leaders: leadersCount,
        groups: groupsCount,
        members: membersCount,
        totalAttendance,
      },
      filter: { from, to },
    });
  } catch (error) {
    console.error("Error fetching bishop dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
