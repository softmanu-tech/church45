"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Layers, RefreshCw, Users, Wifi } from "lucide-react"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { fadeIn, staggerContainer } from "@/lib/motion"

interface StatCardProps {
    title: string
    value: number
    borderColor: string
    textColor: string
    delay?: number
}

interface DashboardStats {
    leaders: number
    groups: number
    members: number
    totalAttendance: number
}

interface Event {
    _id: string
    title: string
    date: string
    createdBy?: {
        _id: string
        name: string
    }
    group?: {
        _id: string
        name: string
    }
}

interface AttendanceRecord {
    _id: string
    date: string
    count: number
    group?: {
        _id: string
        name: string
    }
    leader?: {
        _id: string
        name: string
    }
}

interface Member {
    _id: string
    name: string
    phone?: string
    email?: string
    group?: {
        _id: string
        name: string
    }
}

function StatCard({ title, value, borderColor, textColor, delay = 0 }: StatCardProps) {
    return (
        <motion.div variants={fadeIn("up", "spring", delay, 1)}>
            <Card className={`bg-slate-50 border-l-4 ${borderColor}`}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-gray-600">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className={`text-4xl font-bold ${textColor}`}>{value}</p>
                </CardContent>
            </Card>
        </motion.div>
    )
}

function TableCard<T>({
                          title,
                          headers,
                          data,
                          renderRow,
                          emptyMessage
                      }: {
    title: string
    headers: string[]
    data: T[]
    renderRow: (item: T) => string[]
    emptyMessage: string
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                {headers.map((header) => (
                                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {data.length > 0 ? (
                                data.map((item, index) => (
                                    <motion.tr
                                        key={index}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        {renderRow(item).map((cell, i) => (
                                            <td key={i} className="px-6 py-4 whitespace-nowrap text-sm">
                                                {cell}
                                            </td>
                                        ))}
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={headers.length} className="px-6 py-4 text-center text-sm text-gray-500">
                                        {emptyMessage}
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

function DashboardTabs({
                           attendance,
                           events,
                           members,
                           formatDate
                       }: {
    attendance: AttendanceRecord[]
    events: Event[]
    members: Member[]
    formatDate: (dateStr: string) => string
}) {
    return (
        <Tabs defaultValue="attendance" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="attendance" className="flex items-center gap-2">
                    <Users className="h-4 w-4" /> Attendance
                </TabsTrigger>
                <TabsTrigger value="events" className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" /> Events
                </TabsTrigger>
                <TabsTrigger value="members" className="flex items-center gap-2">
                    <Layers className="h-4 w-4" /> Members
                </TabsTrigger>
            </TabsList>

            <TabsContent value="attendance" className="mt-4">
                <TableCard
                    title="Attendance Records"
                    headers={["Date", "Group", "Leader", "Count"]}
                    data={attendance}
                    renderRow={(record) => [
                        formatDate(record.date),
                        record.group?.name || "N/A",
                        record.leader?.name || "N/A",
                        record.count.toString()
                    ]}
                    emptyMessage="No attendance records found"
                />
            </TabsContent>

            <TabsContent value="events" className="mt-4">
                <TableCard
                    title="Upcoming Events"
                    headers={["Title", "Date", "Group", "Created By"]}
                    data={events}
                    renderRow={(event) => [
                        event.title,
                        formatDate(event.date),
                        event.group?.name || "N/A",
                        event.createdBy?.name || "N/A"
                    ]}
                    emptyMessage="No events found"
                />
            </TabsContent>

            <TabsContent value="members" className="mt-4">
                <TableCard
                    title="Members"
                    headers={["Name", "Phone", "Email", "Group"]}
                    data={members}
                    renderRow={(member) => [
                        member.name,
                        member.phone || "-",
                        member.email || "-",
                        member.group?.name || "N/A"
                    ]}
                    emptyMessage="No members found"
                />
            </TabsContent>
        </Tabs>
    )
}

export default function BishopDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        leaders: 0,
        groups: 0,
        members: 0,
        totalAttendance: 0,
    })
    const [events, setEvents] = useState<Event[]>([])
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState("")
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

    const parseJsonSafely = async (response: Response) => {
        try {
            const text = await response.text()
            return text ? JSON.parse(text) : null
        } catch (err) {
            console.error("Failed to parse JSON:", err)
            return null
        }
    }

    const fetchDashboardData = async () => {
        try {
            setRefreshing(true)
            setError("")

            const [statsRes, eventsRes, attendanceRes, membersRes] = await Promise.all([
                fetch("/api/bishop"),
                fetch("/api/events"),
                fetch("/api/attendance"),
                fetch("/api/members"),
            ])

            if (!statsRes.ok) throw new Error("Failed to fetch dashboard stats")

            const statsData = await parseJsonSafely(statsRes)
            if (!statsData) throw new Error("Invalid stats data")

            // Ensure all values are numbers
            setStats({
                leaders: Number(statsData.leaders) || 0,
                groups: Number(statsData.groups) || 0,
                members: Number(statsData.members) || 0,
                totalAttendance: Number(statsData.totalAttendance) || 0,
            })

            const eventsData = await parseJsonSafely(eventsRes)
            setEvents(eventsData?.events || [])

            const attendanceData = await parseJsonSafely(attendanceRes)
            setAttendance(attendanceData?.attendance || [])

            const membersData = await parseJsonSafely(membersRes)
            setMembers(membersData?.members || [])

            setLastRefreshed(new Date())
        } catch (err) {
            console.error("Error fetching dashboard data:", err)
            setError("Failed to load dashboard data. Please try refreshing the page.")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()

        const interval = setInterval(fetchDashboardData, 30000)
        return () => clearInterval(interval)
    }, [fetchDashboardData])

    const formatDate = (dateStr: string) => {
        try {
            return format(new Date(dateStr), "MMM dd, yyyy")
        } catch {
            return "Invalid date"
        }
    }

    const formatTime = (date: Date | null) => {
        if (!date) return "Loading..."
        return format(date, "hh:mm:ss a")
    }

    return (
        <motion.div
            initial="hidden"
            animate="show"
            variants={staggerContainer(0.1, 0.2)}
            className="p-6 max-w-6xl mx-auto bg-blue-500 space-y-6"
        >
            <motion.div variants={fadeIn("up", "spring", 0.2, 1)}>
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">Bishop Dashboard</h1>
                    <div className="space-x-2">
                        <Link href="/bishop/leaders" className="btn bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-950">
                            Manage Leaders
                        </Link>
                        <Link href="/bishop/groups" className="btn bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-950">
                            Manage Groups
                        </Link>
                    </div>
                </div>
            </motion.div>

            <motion.div variants={fadeIn("up", "spring", 0.4, 1)}>
                <div className="flex justify-between items-center bg-blue-600 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={fetchDashboardData}
                            disabled={refreshing}
                            className="flex items-center gap-2 bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                            {refreshing ? "Refreshing..." : "Refresh Now"}
                        </button>
                        <div className="text-white text-sm">
                            Last updated: <span className="font-medium">{formatTime(lastRefreshed)}</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center gap-1 text-white text-sm">
                            <Wifi className="h-4 w-4 text-green-400" />
                            <span className="text-green-400">Auto-refresh every 30 seconds</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {error && (
                <motion.div variants={fadeIn("up", "spring", 0.6, 1)}>
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                </motion.div>
            )}

            {loading ? (
                <motion.div variants={fadeIn("up", "spring", 0.8, 1)}>
                    <div className="text-center py-8">Loading dashboard data...</div>
                </motion.div>
            ) : (
                <>
                    <motion.div
                        variants={staggerContainer(0.1, 0.2)}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                    >
                        <StatCard
                            title="Leaders"
                            value={stats.leaders}
                            borderColor="border-l-purple-500"
                            textColor="text-purple-700"
                            delay={0.2}
                        />
                        <StatCard
                            title="Groups"
                            value={stats.groups}
                            borderColor="border-l-blue-500"
                            textColor="text-blue-700"
                            delay={0.3}
                        />
                        <StatCard
                            title="Members"
                            value={stats.members}
                            borderColor="border-l-green-500"
                            textColor="text-green-700"
                            delay={0.4}
                        />
                        <StatCard
                            title="Total Attendance"
                            value={stats.totalAttendance}
                            borderColor="border-l-amber-500"
                            textColor="text-amber-700"
                            delay={0.5}
                        />
                    </motion.div>

                    <motion.div variants={fadeIn("up", "spring", 0.6, 1)}>
                        <DashboardTabs
                            attendance={attendance}
                            events={events}
                            members={members}
                            formatDate={formatDate}
                        />
                    </motion.div>
                </>
            )}
        </motion.div>
    )
}