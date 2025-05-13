// src/components/events/EventCard.tsx
"use client"
import { format } from "date-fns"
import { CalendarIcon, UsersIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

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

export default function EventCard({ event }: { event: Event }) {
    return (
        <div className="border rounded-lg overflow-hidden">
            <div className="p-4 space-y-2">
                <h3 className="text-lg font-semibold">{event.title}</h3>
                <div className="flex items-center text-sm text-gray-500">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(new Date(event.date), "PPPp")}
                </div>
                {event.group && (
                    <div className="flex items-center text-sm text-gray-500">
                        <UsersIcon className="mr-2 h-4 w-4" />
                        {event.group.name}
                    </div>
                )}
                {event.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {event.description}
                    </p>
                )}
            </div>
            <div className="border-t p-4 flex justify-end">
                <Link href={`/leader/events/${event._id}`}>
                    <Button variant="outline" size="sm">
                        View Details
                    </Button>
                </Link>
            </div>
        </div>
    )
}