// src/app/(dashboard)/leader/events/page.tsx
"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { CalendarIcon, PlusIcon } from "lucide-react"
import Link from "next/link"
import EventCard from "@/components/EventCard"
import { Skeleton } from "@/components/ui/skeleton"



export interface Event {
    _id: string
    title: string
    date: string  // ISO string format
    description: string
    groupId: string
    createdBy: string
    group?: {
        _id: string
        name: string
    }
}
export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch("/api/events")
                if (!res.ok) throw new Error("Failed to fetch events")
                const data = await res.json()
                setEvents(data.events)
            } catch (error) {
                console.error("Error fetching events:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchEvents().then()
    }, [])

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-[200px]" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-[180px] w-full" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Events</h1>
                <Link href="/leader/events/create">
                    <Button>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Create Event
                    </Button>
                </Link>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-12">
                    <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium">No events yet</h3>
                    <p className="mt-1 text-gray-500">
                        Get started by creating your first event
                    </p>
                    <Link href="/leader/events/create">
                        <Button className="mt-4">Create Event</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {events.map(event => (
                        <EventCard key={event._id} event={event} />
                    ))}
                </div>
            )}
        </div>
    )
}