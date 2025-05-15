"use client"

import { useState, useEffect } from "react"
import { format, subMonths } from "date-fns"
import { CalendarIcon, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface AttendanceRecord {
  _id: string
  date: string
  presentCount: number
  absentCount: number
  totalCount: number
  attendanceRate: number
  event: {
    _id: string
    title: string
  } | null
  presentMembers: {
    _id: string
    name: string
    email?: string
  }[]
}

interface AttendanceHistoryProps {
  groupId: string
}

export function AttendanceHistory({ groupId }: AttendanceHistoryProps) {
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 3))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAttendanceRecords = async () => {
    if (!groupId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/attendance?groupId=${groupId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch attendance records")
      }

      const data = await response.json()
      setRecords(data.records || [])
    } catch (err) {
      console.error("Error fetching attendance records:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch attendance records")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendanceRecords()
  }, [groupId, startDate, endDate])

  const exportToCSV = () => {
    if (records.length === 0) return

    // Create CSV content
    const headers = ["Date", "Event", "Present", "Absent", "Total", "Attendance Rate"]
    const rows = records.map((record) => [
      format(new Date(record.date), "yyyy-MM-dd"),
      record.event?.title || "No specific event",
      record.presentCount,
      record.absentCount,
      record.totalCount,
      `${record.attendanceRate}%`,
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `attendance_${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const averageAttendanceRate =
    records.length > 0
      ? Math.round(records.reduce((sum, record) => sum + record.attendanceRate, 0) / records.length)
      : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Attendance History</span>
          <Button variant="outline" size="sm" onClick={exportToCSV} disabled={loading || records.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardTitle>
        <CardDescription>View and analyze past attendance records</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="space-y-2">
            <span className="text-sm font-medium">Start Date</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  disabled={(date) => date > endDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">End Date</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  disabled={(date) => date < startDate || date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : records.length > 0 ? (
          <>
            <div className="mb-6 p-4 bg-muted rounded-md">
              <div className="text-lg font-medium">Summary</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                <div>
                  <div className="text-sm text-muted-foreground">Records</div>
                  <div className="text-2xl font-bold">{records.length}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Average Attendance</div>
                  <div className="text-2xl font-bold">{averageAttendanceRate}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Date Range</div>
                  <div className="text-sm font-medium">
                    {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead className="text-right">Present</TableHead>
                    <TableHead className="text-right">Absent</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record._id}>
                      <TableCell>{format(new Date(record.date), "MMM d, yyyy")}</TableCell>
                      <TableCell>{record.event?.title || "No specific event"}</TableCell>
                      <TableCell className="text-right">{record.presentCount}</TableCell>
                      <TableCell className="text-right">{record.absentCount}</TableCell>
                      <TableCell className="text-right font-medium">{record.attendanceRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No attendance records found for the selected date range
          </div>
        )}
      </CardContent>
    </Card>
  )
}
