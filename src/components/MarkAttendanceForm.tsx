"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface MarkAttendanceFormProps {
  groupId: string;
  members: Member[];
  onAttendanceMarked: () => void;
  currentUserId: string;
}

interface Member {
  _id: string;
  name: string;
  email?: string;
}

interface Event {
  _id: string;
  title: string;
  date: string;
  description?: string;
  groupId: string;
}

export function MarkAttendanceForm({
  groupId,
  members,
  onAttendanceMarked,
  currentUserId,
}: MarkAttendanceFormProps) {
  const [draftAttendance, setDraftAttendance] = useLocalStorage<{
    date?: string;
    presentMembers: Record<string, boolean>;
    selectedEventId?: string;
  }>(`attendance-draft-${groupId}`, {
    presentMembers: members.reduce(
      (acc, member) => ({
        ...acc,
        [member._id]: true,
      }),
      {}
    ),
  });

  const [date, setDate] = useState<Date | undefined>(
    draftAttendance.date ? new Date(draftAttendance.date) : new Date()
  );
  const [presentMembers, setPresentMembers] = useState<Record<string, boolean>>(
    draftAttendance.presentMembers
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(
    draftAttendance.selectedEventId || ""
  );
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  useEffect(() => {
    setDraftAttendance({
      date: date?.toISOString(),
      presentMembers,
      selectedEventId,
    });
  }, [date, presentMembers, selectedEventId, setDraftAttendance]);

  const fetchEvents = useCallback(async () => {
    if (!groupId) return;

    try {
      setIsLoadingEvents(true);
      const response = await fetch(`/api/events?groupId=${groupId}`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to fetch events");
      }

      const data = await response.json();
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

      setEvents(
        data.events
          .filter((event: Event) => {
            const eventDate = new Date(event.date);
            return eventDate >= thirtyDaysAgo;
          })
          .sort((a: Event, b: Event) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )
      );
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events. Please try again.");
    } finally {
      setIsLoadingEvents(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCheckboxChange = useCallback((memberId: string) => {
    setPresentMembers((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  }, []);

  const handleSelectAll = useCallback((select: boolean) => {
    const newPresentMembers = members.reduce(
      (acc, member) => ({
        ...acc,
        [member._id]: select,
      }),
      {}
    );
    setPresentMembers(newPresentMembers);
  }, [members]);

  const handleSubmit = async () => {
    if (!date) {
      toast.error("Please select a date");
      return;
    }

    if (date > new Date()) {
      toast.error("Attendance date cannot be in the future");
      return;
    }

    const presentCount = Object.values(presentMembers).filter(Boolean).length;
    if (presentCount === 0) {
      toast.error("Please mark at least one member as present");
      return;
    }

    try {
      setIsSubmitting(true);

      const presentIds = Object.entries(presentMembers)
        .filter(([, isPresent]) => isPresent)
        .map(([id]) => id);

      const absentIds = members
        .filter((member) => !presentIds.includes(member._id))
        .map((member) => member._id);

      const payload = {
        date: date.toISOString(),
        groupId,
        presentMembers: presentIds,
        absentMembers: absentIds,
        recordedBy: currentUserId,
        ...(selectedEventId && { eventId: selectedEventId }),
      };

      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to mark attendance");
      }

      setPresentMembers(
        members.reduce(
          (acc, member) => ({
            ...acc,
            [member._id]: true,
          }),
          {}
        )
      );
      setSelectedEventId("");
      setDraftAttendance({ presentMembers: {} });

      toast.success("Attendance recorded successfully");
      onAttendanceMarked();
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to mark attendance"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setPresentMembers(
      members.reduce(
        (acc, member) => ({
          ...acc,
          [member._id]: true,
        }),
        {}
      )
    );
    setDate(new Date());
    setSelectedEventId("");
  };

  const presentCount = Object.values(presentMembers).filter(Boolean).length;
  const attendancePercentage =
    members.length > 0 ? Math.round((presentCount / members.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Date Picker */}
      <div className="space-y-2">
        <Label>Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full sm:w-[240px] justify-start text-left font-normal",
                !date && "text-muted-foreground",
                isSubmitting && "opacity-50"
              )}
              disabled={isSubmitting}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) => date > new Date() || isSubmitting}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Event Selector */}
      <div className="space-y-2">
        <Label>Associated Event (Optional)</Label>
        <Select
          value={selectedEventId}
          onValueChange={setSelectedEventId}
          disabled={isSubmitting || isLoadingEvents}
        >
          <SelectTrigger className="w-full sm:w-[240px]">
            <SelectValue placeholder="Select an event" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="">No specific event</SelectItem>
              {events.map((event) => (
                <SelectItem key={event._id} value={event._id}>
                  {event.title} ({format(new Date(event.date), "MMM d")})
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {isLoadingEvents && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading events...
          </div>
        )}
      </div>

      {/* Members List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Mark Present Members *</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll(true)}
              disabled={isSubmitting || members.length === 0}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll(false)}
              disabled={isSubmitting || members.length === 0}
            >
              Deselect All
            </Button>
          </div>
        </div>

        {members.length > 0 ? (
          <div className="space-y-3 max-h-60 overflow-y-auto p-2 border rounded-md">
            {members.map((member) => (
              <div key={member._id} className="flex items-center space-x-2">
                <Checkbox
                  id={`member-${member._id}`}
                  checked={!!presentMembers[member._id]}
                  onCheckedChange={() => handleCheckboxChange(member._id)}
                  disabled={isSubmitting}
                />
                <label
                  htmlFor={`member-${member._id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {member.name}
                  {member.email && (
                    <span className="block text-xs text-muted-foreground">
                      {member.email}
                    </span>
                  )}
                </label>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No members in this group</p>
        )}

        <div className="mt-2 text-sm">
          <p>
            <span className="font-medium">Attendance Summary:</span> {presentCount}{" "}
            present, {members.length - presentCount} absent ({attendancePercentage}
            %)
          </p>
        </div>
      </div>

      {/* Submit and Reset Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handleSubmit}
          disabled={
            isSubmitting || !date || presentCount === 0 || date > new Date()
          }
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Attendance"
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Reset Form
        </Button>
      </div>
    </div>
  );
}