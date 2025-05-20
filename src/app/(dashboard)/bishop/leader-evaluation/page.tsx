'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

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
}

export interface DashboardResponse {
  group: Group;
  members: Member[];
  events: Event[];
  attendanceRecords: {
    _id: string;
    event: string;
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
      className="w-full h-8 bg-gray-300 rounded my-2"
    />
  );
}

export default function LeaderDashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtering and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<'name' | 'attendanceCount' | 'lastAttendanceDate' | 'rating'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Fetch data with filters
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedEventId) params.append('eventId', selectedEventId);
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);

        const res = await fetch(`/api/leader?${params.toString()}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch data');
        }

        const json: DashboardResponse = await res.json();
        setData(json);
        setCurrentPage(1);
      } catch (err) {
        console.error('Fetch error:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedEventId, fromDate, toDate]);

  // Memoized filtered members
  const filteredMembers = useMemo(() => {
    if (!data) return [];
    let filtered = data.members;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(term) || m.email.toLowerCase().includes(term)
      );
    }

    return ratingFilter 
      ? filtered.filter(m => m.rating === ratingFilter)
      : filtered;
  }, [data, searchTerm, ratingFilter]);

  // Sorting logic
  const sortedMembers = useMemo(() => {
    const sorted = [...filteredMembers];
    const ratingsOrder = { Excellent: 1, Average: 2, Poor: 3 };

    return sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'attendanceCount':
          cmp = a.attendanceCount - b.attendanceCount;
          break;
        case 'lastAttendanceDate': {
          const aDate = new Date(a.lastAttendanceDate || 0).getTime();
          const bDate = new Date(b.lastAttendanceDate || 0).getTime();
          cmp = aDate - bDate;
          break;
        }
        case 'rating':
          cmp = ratingsOrder[a.rating] - ratingsOrder[b.rating];
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filteredMembers, sortKey, sortDirection]);

  // Pagination
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedMembers.slice(start, start + PAGE_SIZE);
  }, [sortedMembers, currentPage]);

  // Chart data
  const ratingDistribution = useMemo(() => {
    if (!data) return [];
    const counts = { Excellent: 0, Average: 0, Poor: 0 };
    data.members.forEach(m => counts[m.rating]++);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  const attendanceTrend = useMemo(() => {
    if (!data) return [];
    const dateMap = new Map<string, number>();
    
    data.attendanceRecords.forEach(({ date, presentMembers }) => {
      const dateStr = new Date(date).toISOString().slice(0, 10);
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + presentMembers.length);
    });

    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, attendance]) => ({ date, attendance }));
  }, [data]);

  if (loading) return (
    <div className="p-4 max-w-7xl mx-auto">
      <LoadingSkeleton />
      <LoadingSkeleton />
      <LoadingSkeleton />
    </div>
  );

  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!data) return <div className="p-4">No data available.</div>;

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold mb-4">{data.group.name} - Leader Dashboard</h1>

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
          {Object.keys(ratingColors).map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        {/* Sorting controls */}
        <div className="flex gap-2">
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
        </div>

        {/* Event and date filters */}
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

        <div className="flex gap-2">
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
      </div>

      {/* Members Table */}
      <motion.table
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full border-collapse border border-blue-500 text-left"
      >
        {/* Table headers and body remain the same */}
      </motion.table>

      {/* Pagination and Charts remain the same */}
    </div>
  );
}