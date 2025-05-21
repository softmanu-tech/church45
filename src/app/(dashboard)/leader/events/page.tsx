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
import { motion } from "framer-motion"

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
  }, [page, limit, events, groupFilter, dateRange])

  // Sync URL params on state change
  useEffect(() => {
    const params = new URLSearchParams()
    params.set("page", page.toString())
    params.set("limit", limit.toString())
    if (groupFilter) params.set("groupId", groupFilter)
    if (dateRange.startDate) params.set("startDate", dateRange.startDate)
    if (dateRange.endDate) params.set("endDate", dateRange.endDate)
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [page, limit, groupFilter,router, dateRange])

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      
     className="p-4 max-w-7xl mx-auto">
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
    </motion.div>
  )
}
