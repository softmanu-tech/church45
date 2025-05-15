import { NextResponse } from "next/server"
import dbConnect from "@/lib/dbConnect"
import { type IUser, User } from "@/lib/models/User"
import { Event, type IEvent } from "@/lib/models/Event"

// Use request if you want to get the userId from the query (e.g. /api/leader?userId=xxx)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 })
    }

    await dbConnect()

    // Fetch leader's group
    const leader = await User.findById(userId).populate("group")
    if (!leader?.group) {
      return NextResponse.json({ group: null, events: [], members: [] })
    }

    // Ensure the user is a leader
    if (leader.role !== "leader") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch group events
    const events = await Event.find({ group: leader.group._id })
      .sort({ date: 1 })
      .lean<IEvent[]>()

    // Fetch group members
    const members = await User.find({ group: leader.group._id, role: "member" })
      .select("name email phone")
      .lean<IUser[]>()

    // Respond with the leader's group, events, and members
    return NextResponse.json({
      group: {
        _id: leader.group._id.toString(),
        name: leader.group.name,
      },
      events: events.map((event) => ({
        _id: event._id.toString(),
        title: event.title,
        date: event.date.toISOString(),
        description: event.description,
        groupId: leader.group._id.toString(),
      })),
      members: members.map((member) => ({
        _id: member._id.toString(),
        name: member.name,
        email: member.email,
        phone: member.phone,
      })),
    })
  } catch (error) {
    console.error("Error fetching leader data:", error)
    return NextResponse.json({ error: "Failed to fetch leader data" }, { status: 500 })
  }
}


/////////////////////////
// /app/api/events/route.ts (Next.js app router API route example)

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import { Event } from '@/lib/models/Event'
import { User } from '@/lib/models/User'

export async function GET(request: Request) {
  await dbConnect()

  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page')) || 1
  const limit = Number(url.searchParams.get('limit')) || 10
  const groupId = url.searchParams.get('groupId') || undefined
  const startDate = url.searchParams.get('startDate')
  const endDate = url.searchParams.get('endDate')

  const filter: any = {}

  if (groupId) filter.group = groupId

  if (startDate || endDate) {
    filter.date = {}
    if (startDate) filter.date.$gte = new Date(startDate)
    if (endDate) filter.date.$lte = new Date(endDate)
  }

  const skip = (page - 1) * limit

  const events = await Event.find(filter)
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const total = await Event.countDocuments(filter)

  // For each event, fetch attendance count
  // Assuming attendance is stored in event.attendance as array of member IDs or similar
  const eventsWithAttendance = await Promise.all(events.map(async (event) => {
    // Example: attendance count = event.attendance.length
    const attendanceCount = event.attendance ? event.attendance.length : 0
    return { ...event, attendanceCount }
  }))

  return NextResponse.json({
    events: eventsWithAttendance,
    total,
    page,
    limit,
  })
}
////////////

"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react" // loading spinner icon
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import jsPDF from "jspdf"

interface EventType {
  _id: string
  title: string
  date: string
  attendanceCount: number
  group: { name: string; _id: string }
}

interface ApiResponse {
  events: EventType[]
  total: number
  page: number
  limit: number
}

export default function BishopDashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Sync URL query with state
  const [page, setPage] = useState(Number(searchParams.get("page") || "1"))
  const [limit, setLimit] = useState(Number(searchParams.get("limit") || "10"))
  const [groupFilter, setGroupFilter] = useState(searchParams.get("groupId") || "")
  const [dateRange, setDateRange] = useState({
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
  })

  const [events, setEvents] = useState<EventType[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const observer = useRef<IntersectionObserver | null>(null)
  const lastEventElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return
      if (observer.current) observer.current.disconnect()
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1)
        }
      })
      if (node) observer.current.observe(node)
    },
    [loading, hasMore]
  )

  // Fetch events from API
  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.append("page", page.toString())
        params.append("limit", limit.toString())
        if (groupFilter) params.append("groupId", groupFilter)
        if (dateRange.startDate) params.append("startDate", dateRange.startDate)
        if (dateRange.endDate) params.append("endDate", dateRange.endDate)

        const res = await fetch(`/api/events?${params.toString()}`)
        const data: ApiResponse = await res.json()

        if (page === 1) {
          setEvents(data.events)
        } else {
          setEvents((prev) => [...prev, ...data.events])
        }

        setTotal(data.total)
        setHasMore(data.events.length > 0 && events.length + data.events.length < data.total)
      } catch (error) {
        console.error("Failed to fetch events", error)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [page, limit, groupFilter, dateRange])

  // Sync URL params on state change
  useEffect(() => {
    const params = new URLSearchParams()
    params.set("page", page.toString())
    params.set("limit", limit.toString())
    if (groupFilter) params.set("groupId", groupFilter)
    if (dateRange.startDate) params.set("startDate", dateRange.startDate)
    if (dateRange.endDate) params.set("endDate", dateRange.endDate)
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [page, limit, groupFilter, dateRange])

  // Export to PDF function
  function exportToPDF() {
    const doc = new jsPDF()
    doc.text("Events Attendance Report", 10, 10)
    let y = 20
    events.forEach((event, idx) => {
      doc.text(
        `${idx + 1}. ${event.title} - Date: ${new Date(event.date).toLocaleDateString()} - Attendance: ${
          event.attendanceCount
        } - Group: ${event.group?.name || "N/A"}`,
        10,
        y
      )
      y += 10
    })
    doc.save("events-attendance-report.pdf")
  }

  // Attendance data for chart
  const chartData = events.map((e) => ({
    name: e.title,
    attendance: e.attendanceCount,
  }))

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Bishop Dashboard</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div>
          <label className="block font-semibold">Group Filter</label>
          <input
            type="text"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            placeholder="Enter group ID"
            className="border rounded px-2 py-1 w-full sm:w-60"
          />
        </div>

        <div>
          <label className="block font-semibold">Start Date</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange((d) => ({ ...d, startDate: e.target.value }))}
            className="border rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="block font-semibold">End Date</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange((d) => ({ ...d, endDate: e.target.value }))}
            className="border rounded px-2 py-1"
          />
        </div>

        <button
          onClick={() => {
            setPage(1) // reset page to fetch with new filters
          }}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Apply Filters
        </button>
      </div>

      {/* Page size selector */}
      <div className="mb-4">
        <label className="mr-2 font-semibold">Page size:</label>
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value))
            setPage(1)
          }}
          className="border rounded px-2 py-1"
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* Export button */}
      <button
        onClick={exportToPDF}
        className="mb-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Export to PDF
      </button>

      {/* Events list */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 rounded overflow-hidden">
          <thead className="bg-purple-600 text-white">
            <tr>
              <th className="p-2">Title</th>
              <th className="p-2">Date</th>
              <th className="p-2">Attendance</th>
              <th className="p-2">Group</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, idx) => {
              if (idx === events.length - 1) {
                // last element for infinite scroll
                return (
                  <tr key={event._id} ref={lastEventElementRef} className="border-b border-gray-300">
                    <td className="p-2">{event.title}</td>
                    <td className="p-2">{new Date(event.date).toLocaleDateString()}</td>
                    <td className="p-2 text-center">{event.attendanceCount}</td>
                    <td className="p-2">{event.group?.name || "N/A"}</td>
                  </tr>
                )
              }
              return (
                <tr key={event._id} className="border-b border-gray-300">
                  <td className="p-2">{event.title}</td>
                  <td className="p-2">{new Date(event.date).toLocaleDateString()}</td>
                  <td className="p-2 text-center">{event.attendanceCount}</td>
                  <td className="p-2">{event.group?.name || "N/A"}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Loading spinner */}
      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="animate-spin text-purple-600" size={32} />
        </div>
      )}

      {/* Attendance Chart */}
      <div className="mt-10 w-full h-64 sm:h-96">
        <h2 className="text-xl font-semibold mb-2">Attendance Statistics</h2>
        {events.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-45} textAnchor="end" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="attendance" fill="#7c3aed" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p>No data for attendance chart</p>
        )}
      </div>
    </div>
  )
}
