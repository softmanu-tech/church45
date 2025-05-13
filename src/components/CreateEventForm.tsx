"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Toaster } from "@/components/ui/sonner"

// Define TypeScript interfaces
interface Event {
    _id: string
    title: string
    date: string
    description?: string
    groupId: string
}

interface ApiError {
    error: string
}

// Zod schema for form validation
const eventFormSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title too long"),
    date: z.date({
        required_error: "Event date is required",
        invalid_type_error: "Invalid date format",
    }),
    description: z.string().max(500, "Description too long").optional(),
})

type EventFormValues = z.infer<typeof eventFormSchema>

interface CreateEventFormProps {
    groupId: string
    onEventCreated: (event: Event) => void
}

export function CreateEventForm({ groupId, onEventCreated }: CreateEventFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventFormSchema),
        defaultValues: {
            title: "",
            description: "",
        },
    })

    async function onSubmit(values: EventFormValues) {
        try {
            setIsSubmitting(true)

            const response = await fetch("/api/events", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...values,
                    groupId,
                    date: values.date.toISOString(),
                }),
            })

            if (!response.ok) {
                const errorData: ApiError = await response.json()
                throw new Error(errorData.error || "Failed to create event")
            }

            const newEvent: Event = await response.json()
            onEventCreated(newEvent)
            form.reset()

            Toaster({
                title: "Success",
                description: "Event created successfully",
                variant: "default",
            })

        } catch (error) {
            console.error("Error creating event:", error)
            Toaster({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create event",
                variant: "error",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Event Title *</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Weekly meeting"
                                    {...field}
                                    disabled={isSubmitting}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Event Date *</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-[240px] pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground",
                                                isSubmitting && "opacity-50"
                                            )}
                                            disabled={isSubmitting}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date < new Date() || isSubmitting}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Event details..."
                                    className="resize-none"
                                    {...field}
                                    disabled={isSubmitting}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                >
                    {isSubmitting ? (
                        <>
                            <span className="animate-spin mr-2">↻</span>
                            Creating...
                        </>
                    ) : "Create Event"}
                </Button>
            </form>
        </Form>
    )
}