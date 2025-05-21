'use client';
import React, { useState, useEffect, useMemo } from 'react';

import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import Link from 'next/link';
import { fadeIn } from '@/lib/motion';

interface Member {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  attendanceCount: number;
  lastAttendanceDate: string | null;
  rating: 'Excellent' | 'Average' | 'Poor';
}

interface Event {
  _id: string;
  name: string;
  date: string;
}



interface Group {
  _id: string;
  name: string;
  leader: {
    _id: string;
    name: string;
  } | null;

}

export interface DashboardResponse {
  group: Group;
  members: Member[];
  events: Event[];
  attendanceRecords: {
    _id: string;
    event: string;
    group: string;
    date: string;
    presentMembers: string[];
  }[];
}

const PAGE_SIZE = 10;

const ratingColors = {
  Excellent: '#4caf50',
  Average: '#ff9800',
  Poor: '#f44336',
};

function LoadingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0.3 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
      className="w-full h-8 bg-blue-400 rounded my-2"
    />
  );
}

export default function LeaderDashboard() {
  const [data, setData] = useState<DashboardResponse| null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAddMember, setOpenAddMember] = useState(false);

  // Filtering and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<'name' | 'attendanceCount' | 'lastAttendanceDate' | 'rating'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // New filters for events and dates
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>(''); // YYYY-MM-DD
  const [toDate, setToDate] = useState<string>(''); // YYYY-MM-DD

  // Fetch data with all filters applied as query params
  useEffect(() => {

    console.log("DEBUG - Filter changes detected:", {
      selectedEventId,
      fromDate,
      toDate
    });
    const  fetchData = async () => {
      setLoading(true);
      try {
        
        const params = new URLSearchParams();
        //params.append('userId', userId);
        if (selectedEventId) params.append('eventId', selectedEventId);
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);

        console.log('Fetching with params:', params.toString());


        const res = await fetch(`/api/leader?${params.toString()}`,{
          credentials: 'include', //sent cookies
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch data');
        }
        const json: DashboardResponse = await res.json();
        setData(json);
        setCurrentPage(1); // Reset page on new filter
      } catch (err) {
        console.error('Fetch error:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }; 
    
    fetchData();
  }, [ selectedEventId, fromDate, toDate]);

  // The rest filtering/search/sort/pagination logic stays the same...

  const filteredMembers = useMemo(() => {
    if (!data) return [];

    let filtered = data.members;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((m) =>
        m.name.toLowerCase().includes(term) || m.email.toLowerCase().includes(term)
      );
    }

    if (ratingFilter) {
      filtered = filtered.filter((m) => m.rating === ratingFilter);
    }

    return filtered;
  }, [data, searchTerm, ratingFilter]);

  const sortedMembers = useMemo(() => {
    const sorted = [...filteredMembers];
    sorted.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortKey === 'attendanceCount') {
        cmp = a.attendanceCount - b.attendanceCount;
      } else if (sortKey === 'lastAttendanceDate') {
        cmp = (new Date(a.lastAttendanceDate ?? 0).getTime() || 0) - (new Date(b.lastAttendanceDate ?? 0).getTime() || 0);
      } else if (sortKey === 'rating') {
        const ratingsOrder = { Excellent: 1, Average: 2, Poor: 3 };
        cmp = ratingsOrder[a.rating] - ratingsOrder[b.rating];
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredMembers, sortKey, sortDirection]);

  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedMembers.slice(start, start + PAGE_SIZE);
  }, [sortedMembers, currentPage]);

  const ratingDistribution = useMemo(() => {
    if (!data) return [];
    const counts = { Excellent: 0, Average: 0, Poor: 0 };
    data.members.forEach((m) => counts[m.rating]++);
    return [
      { name: 'Excellent', value: counts.Excellent },
      { name: 'Average', value: counts.Average },
      { name: 'Poor', value: counts.Poor },
    ];
  }, [data]);

  const attendanceTrend = useMemo(() => {
    if (!data) return [];

    const dateMap = new Map<string, number>();
    data.attendanceRecords.forEach((record) => {
      const dateStr = new Date(record.date).toISOString().slice(0, 10);
      dateMap.set(dateStr, (dateMap.get(dateStr) ?? 0) + record.presentMembers.length);
    });

    const sortedDates = [...dateMap.keys()].sort();

    return sortedDates.map((date) => ({ date, attendance: dateMap.get(date)! }));
  }, [data]);

  if (loading) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (!data) {
    return <div className="p-4">No data available.</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      key="leader-dashboard"  
        className="p-4 max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold mb-4"></h1>
      <motion.div variants={fadeIn("up", "spring", 0.2, 1)}>
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">{data.group.name} -  Leader Dashboard</h1>
                    <div className="space-x-2">
                    <button className='border-2  border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all py-1 px-3 rounded-full' onClick={()=>setOpenAddMember(true)}>Add Member</button>
                        <Link href="/leader/events" className="btn bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-950">
                            Create Event
                        </Link>
                    </div>
                </div>
            </motion.div>


      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search members by name or email"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="border px-3 py-2 rounded flex-grow min-w-[250px]"
        />

        <select
          value={ratingFilter ?? ''}
          onChange={(e) => {
            setRatingFilter(e.target.value || null);
            setCurrentPage(1);
          }}
          className="border px-3 py-2 rounded"
        >
          <option value="">Filter by rating</option>
          <option value="Excellent">Excellent</option>
          <option value="Average">Average</option>
          <option value="Poor">Poor</option>
        </select>

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
          className="border px-3 py-2 rounded"
        >
          <option value="name">Sort by Name</option>
          <option value="attendanceCount">Sort by Attendance</option>
          <option value="lastAttendanceDate">Sort by Last Attendance</option>
          <option value="rating">Sort by Rating</option>
        </select>

        <select
          value={sortDirection}
          onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
          className="border px-3 py-2 rounded"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>

        {/* New Event Filter */}
        <select
          value={selectedEventId}
          onChange={(e) => {
            setSelectedEventId(e.target.value);
            setCurrentPage(1);
          }}
          className="border px-3 py-2 rounded"
        >
          <option value="">All Events</option>
          {data.events.map((ev) => (
            <option key={ev._id} value={ev._id}>
              {ev.name} ({new Date(ev.date).toLocaleDateString()})
            </option>
          ))}
        </select>

        {/* From Date */}
        <input
          type="date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setCurrentPage(1);
          }}
          className="border px-3 py-2 rounded"
          max={toDate || undefined}
          placeholder="From Date"
        />

        {/* To Date */}
        <input
          type="date"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setCurrentPage(1);
          }}
          className="border px-3 py-2 rounded"
          min={fromDate || undefined}
          placeholder="To Date"
        />
      </div>

      {/* Members Table */}
      <motion.table
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full border-collapse border border-blue-500 text-left"
      >
        <thead>
          <tr>
            <th className="border border-black p-2 cursor-pointer" onClick={() => {
              setSortKey('name');
              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            }}>Name</th>
            <th className="border border-gray-300 p-2">Email</th>
            <th className="border border-gray-300 p-2">Phone</th>
            <th className="border border-gray-300 p-2 cursor-pointer text-right" onClick={() => {
              setSortKey('attendanceCount');
              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            }}>Attendance</th>
            <th className="border border-gray-300 p-2 cursor-pointer" onClick={() => {
              setSortKey('lastAttendanceDate');
              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            }}>Last Attendance</th>
            <th className="border border-gray-300 p-2 cursor-pointer" onClick={() => {
              setSortKey('rating');
              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            }}>Rating</th>
          </tr>
        </thead>
        <tbody>
          {paginatedMembers.map((member) => (
            <tr key={member._id}>
              <td className="border border-gray-300 p-2">{member.name}</td>
              <td className="border border-gray-300 p-2">{member.email}</td>
              <td className="border border-gray-300 p-2">{member.phone}</td>
              <td className="border border-gray-300 p-2 text-right">{member.attendanceCount}</td>
              <td className="border border-gray-300 p-2">
                {member.lastAttendanceDate
                  ? new Date(member.lastAttendanceDate).toLocaleDateString()
                  : 'Never'}
              </td>
              <td className="border border-gray-300 p-2">
                <span style={{ color: ratingColors[member.rating] }} className="font-semibold">
                  {member.rating}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </motion.table>

      {/* Pagination */}
      <div className="flex justify-center mt-4 space-x-2">
        {Array.from({ length: Math.ceil(sortedMembers.length / PAGE_SIZE) }).map((_, i) => (
          <button
            key={i}
            className={`px-3 py-1 rounded border ${
              currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'
            }`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
        <div>
          <h2 className="text-xl font-semibold mb-3">Attendance Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceTrend}>
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="attendance" fill="#3182ce" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Member Rating Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ratingDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {ratingDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={ratingColors[entry.name as keyof typeof ratingColors]} />

                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/** openAddMembere*/}
      
    </motion.div>
  );
}
