"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, Layers, RefreshCw, Users } from "lucide-react"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { fadeIn } from "@/lib/motion"
import { CreateEventForm } from "@/components/CreateEventForm"
import { MarkAttendanceForm } from "@/components/MarkAttendanceForm"
import { MembersTable } from "@/components/MembersTable"
import { toast } from "sonner"

interface Group {
  _id: string
  name: string
}

interface Event {
  _id: string
  title: string
  groupId: string
  date: string
  description?: string
}

interface Member {
  _id: string
  name: string
  email: string
  phone: string
}

export default function LeaderDashboard() {
  const [group, setGroup] = useState<Group | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]) // Adjust type as needed
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("events")

  // Fetch leader data from the API
  const fetchLeaderData = async () => {
    try {
      setLoading(true)

      const res = await fetch("/api/leader")

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch leader data")
      }

      const data = await res.json()

      setGroup(data.group || null)
      setEvents(data.events || [])
      setMembers(data.members || [])
    } catch (error) {
      console.error("Error fetching leader data:", error)
      toast.error(error instanceof Error ? error.message : "Failed to fetch leader data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderData()
  }, [])

  // Handle new event creation
  const handleEventCreated = (newEvent: Event) => {
    setEvents((prevEvents) => [...prevEvents, newEvent])
  }

  // Handle attendance marking
  const handleAttendanceMarked = () => {
    fetchLeaderData()
  }

  // Handle new member creation
  const handleMemberCreated = () => {
    fetchLeaderData()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold">No group assigned</h2>
          <p className="text-gray-500">Please contact the bishop to be assigned to a group.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Dashboard Header */}
      <motion.div initial="hidden" animate="show" variants={fadeIn("up", "spring", 0.2, 1)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Leader Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Group: {group.name}</h3>
                <p className="text-gray-500">
                  {members.length} members | {events.length} upcoming events
                </p>
              </div>
              <button
                onClick={fetchLeaderData}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" /> Events
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Attendance
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Layers className="h-4 w-4" /> Members
          </TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events" className="mt-4">
          <motion.div variants={fadeIn("up", "spring", 0.4, 1)}>
            <Card>
              <CardHeader>
                <CardTitle>Manage Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <CreateEventForm groupId={group._id} onEventCreated={handleEventCreated} />

                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Upcoming Events</h3>
                  {events.length > 0 ? (
                    <div className="space-y-4">
                      {events.map((event) => (
                        <div key={event._id} className="border rounded-lg p-4">
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-gray-500">{format(new Date(event.date), "MMM dd, yyyy 'at' h:mm a")}</p>
                          <p className="mt-2">{event.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No upcoming events</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="mt-4">
          <motion.div variants={fadeIn("up", "spring", 0.6, 1)}>
            <Card>
              <CardHeader>
                <CardTitle>Mark Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <MarkAttendanceForm
                  groupId={group._id}
                  members={members}
                  onAttendanceMarked={handleAttendanceMarked}
                  currentUserId={group._id}
                />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-4">
          <motion.div variants={fadeIn("up", "spring", 0.8, 1)}>
            <Card>
              <CardHeader>
                <CardTitle>Group Members</CardTitle>
              </CardHeader>
              <CardContent>
                <MembersTable members={members} groupId={group._id} onMemberAdded={handleMemberCreated} />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
