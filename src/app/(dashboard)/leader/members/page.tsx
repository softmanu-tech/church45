// app/leader/page.tsx
'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type EnhancedMember = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  attendanceCount: number;
  lastAttendanceDate: string | null;
  rating: 'Excellent' | 'Average' | 'Poor';
};

type Group = {
  _id: string;
  name: string;
};

type Event = {
  _id: string;
  name: string;
  date: string;
};

export default function LeaderPage() {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<EnhancedMember[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderData = async () => {
      try {
        const res = await fetch('/api/leader');
        if (!res.ok) throw new Error('Failed to fetch leader data');
        const data = await res.json();

        setGroup(data.group);
        setMembers(data.members);
        setEvents(data.events);
      } catch (error: any) {
        console.error(error);
        toast.error(error.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderData();
  }, []);

  if (loading) return <p className="text-center">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Group: {group?.name}</h1>

      <h2 className="text-xl font-semibold mt-6 mb-2">Members</h2>
      <ul className="space-y-2">
        {members.map(member => (
          <li key={member._id} className="p-4 bg-slate-100 rounded shadow">
            <p><strong>{member.name}</strong> ({member.email})</p>
            <p>Phone: {member.phone ?? 'N/A'}</p>
            <p>Attendance: {member.attendanceCount}</p>
            <p>Rating: {member.rating}</p>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Events</h2>
      <ul className="space-y-2">
        {events.map(event => (
          <li key={event._id} className="p-4 bg-slate-100 rounded shadow">
            <p><strong>{event.name}</strong> on {new Date(event.date).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
