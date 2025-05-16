import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { User } from "@/lib/models/User";
import Group from "@/lib/models/Group";
import { Attendance } from "@/lib/models/Attendance";
import Event from "@/lib/models/Event"; // Assuming default export here
import { requireSessionAndRole } from "@/lib/authMiddleware";
import { Types } from "mongoose";

interface Leader {
  _id: Types.ObjectId;
  name: string;
  email: string;
}

interface GroupWithLeader {
  _id: Types.ObjectId;
  name: string;
  leader?: Leader | null;
}

export async function GET(request: Request) {
  const roleCheck = await requireSessionAndRole(request, "bishop");
  if (!roleCheck)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await dbConnect();

    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    let dateFilter = {};
    if (from || to) {
      dateFilter = {
        date: {
          ...(from ? { $gte: new Date(from) } : {}),
          ...(to ? { $lte: new Date(to) } : {}),
        },
      };
    }

    const [leadersCount, groupsCount, membersCount, attendanceRecords] =
      await Promise.all([
        User.countDocuments({ role: "leader" }),
        Group.countDocuments(),
        User.countDocuments({ role: "member" }),
        Attendance.find(dateFilter).lean(),
      ]);

    const totalAttendance = attendanceRecords.reduce(
      (sum, record) => sum + (record.presentMembers?.length || 0),
      0
    );

    const groups = await Group.find()
      .populate<{ leader: Leader }>("leader", "name email")
      .lean();

    const detailedStats = await Promise.all(
      groups.map(async (group) => {
        const g = group as GroupWithLeader;
        const [memberCount, eventCount, attendanceCount] = await Promise.all([
          User.countDocuments({ group: g._id, role: "member" }),
          Event.countDocuments({ group: g._id }),
          Attendance.countDocuments({ group: g._id }),
        ]);

        return {
          groupId: g._id.toString(),
          groupName: g.name,
          leaderName: g.leader?.name || "Unassigned",
          leaderEmail: g.leader?.email || "N/A",
          memberCount,
          eventCount,
          attendanceCount,
        };
      })
    );

    return NextResponse.json({
      stats: {
        totalLeaders: leadersCount,
        totalGroups: groupsCount,
        totalMembers: membersCount,
        totalAttendance,
      },
      groups: detailedStats,
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
