






// src/app/(dashboard)/leader/events/create/page.tsx
"use client"
import { CreateEventForm } from "@/components/CreateEventForm"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"

export default function CreateEventPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/leader/events">
                    <Button variant="outline" size="icon">
                        <ArrowLeftIcon className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Create New Event</h1>
            </div>

            <CreateEventForm
                onEventCreated={(event) => {
                    window.location.href = `/leader/events/${event._id}`
                }}
                groupId={""} 
            />
        </div>
    )
}

//////////////////////////////////////////////////////