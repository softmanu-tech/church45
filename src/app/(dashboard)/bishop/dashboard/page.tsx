"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface GroupSummary {
  groupId: string;
  groupName: string;
  leaderName: string;
  memberCount: number;
  eventCount: number;
  attendanceCount: number;
}

interface BishopDashboardData {
  stats: {
    totalLeaders: number;
    totalGroups: number;
    totalMembers: number;
    totalAttendance: number;
  };
  groups: GroupSummary[];
}

export default function BishopDashboard() {
  const [data, setData] = useState<BishopDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/bishop/dashboard");
        const json = (await res.json()) as BishopDashboardData;
        setData(json);
      } catch (err) {
        console.error("Failed to fetch bishop dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Skeleton className="w-full h-48 rounded-xl" />;
  if (!data)
    return <div className="text-red-600">Failed to load dashboard data</div>;

  const { stats, groups } = data;

  return (
    <div className="p-4 grid gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <h2 className="text-xl font-semibold">Leaders</h2>
            <p className="text-2xl">{stats.totalLeaders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <h2 className="text-xl font-semibold">Groups</h2>
            <p className="text-2xl">{stats.totalGroups}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <h2 className="text-xl font-semibold">Members</h2>
            <p className="text-2xl">{stats.totalMembers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <h2 className="text-xl font-semibold">Attendance</h2>
            <p className="text-2xl">{stats.totalAttendance}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Group Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group: GroupSummary) => (
            <Card key={group.groupId}>
              <CardContent className="p-4">
                <h4 className="font-semibold text-lg mb-1">{group.groupName}</h4>
                <p className="text-sm text-gray-500">
                  Leader: {group.leaderName}
                </p>
                <div className="mt-2 text-sm">
                  <p>Members: {group.memberCount}</p>
                  <p>Events: {group.eventCount}</p>
                  <p>Attendance Records: {group.attendanceCount}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-2">Attendance by Group</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={groups}>
            <XAxis dataKey="groupName" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="attendanceCount" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
