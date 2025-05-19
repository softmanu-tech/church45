<option value="asc">Ascending</option>
<option value="desc">Descending</option>
</select>

{/* Event filter */}
<select
value={selectedEventId}
onChange={(e) => setSelectedEventId(e.target.value)}
className="border px-3 py-2 rounded"
>
<option value="">All Events</option>
{data.events.map(event => (
  <option key={event._id} value={event._id}>
    {event.name} ({new Date(event.date).toLocaleDateString()})
  </option>
))}
</select>

{/* Date filters */}
<input
type="date"
value={fromDate}
onChange={(e) => setFromDate(e.target.value)}
className="border px-3 py-2 rounded"
/>
<input
type="date"
value={toDate}
onChange={(e) => setToDate(e.target.value)}
className="border px-3 py-2 rounded"
/>
</div>

{/* Charts */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
{/* Rating Distribution */}
<div className="w-full h-64">
<h2 className="text-xl font-semibold mb-2">Rating Distribution</h2>
<ResponsiveContainer width="100%" height="100%">
  <PieChart>
    <Pie
      data={ratingDistribution}
      dataKey="value"
      nameKey="name"
      cx="50%"
      cy="50%"
      outerRadius={80}
      label
    >
      {ratingDistribution.map((entry, index) => (
      ))}
    </Pie>
    <Legend />
  </PieChart>
</ResponsiveContainer>
</div>

{/* Attendance Trend */}
<div className="w-full h-64">
<h2 className="text-xl font-semibold mb-2">Attendance Trend</h2>
<ResponsiveContainer width="100%" height="100%">
  <BarChart data={attendanceTrend}>
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="attendance" fill="#8884d8" />
  </BarChart>
</ResponsiveContainer>
</div>
</div>

{/* Member Table */}
<div className="overflow-x-auto mt-6">
<table className="min-w-full border divide-y divide-gray-200">
<thead className="bg-slate-200">
  <tr className="text-purple-600">
    <th className="px-4 py-2 text-left">Name</th>
    <th className="px-4 py-2 text-left">Email</th>
    <th className="px-4 py-2 text-left">Phone</th>
    <th className="px-4 py-2 text-left">Attendance</th>
    <th className="px-4 py-2 text-left">Last Attended</th>
    <th className="px-4 py-2 text-left">Rating</th>
  </tr>
</thead>
<tbody className="divide-y divide-gray-100">
  {paginatedMembers.map((member) => (
    <tr key={member._id}>
      <td className="px-4 py-2">{member.name}</td>
      <td className="px-4 py-2">{member.email}</td>
      <td className="px-4 py-2">{member.phone || 'N/A'}</td>
      <td className="px-4 py-2">{member.attendanceCount}</td>
      <td className="px-4 py-2">
        {member.lastAttendanceDate ? new Date(member.lastAttendanceDate).toLocaleDateString() : 'Never'}
      </td>
      <td className="px-4 py-2">
        <span
          className="font-medium"
          style={{ color: ratingColors[member.rating] }}
        >
          {member.rating}
        </span>
      </td>
    </tr>
  ))}
</tbody>
</table>
</div>

{/* Pagination */}
<div className="flex justify-between items-center mt-4">
<button
onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
disabled={currentPage === 1}
className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
>
Previous
</button>
<span className="text-sm text-gray-600">Page {currentPage}</span>
<button
onClick={() =>
  setCurrentPage((prev) =>
    prev * PAGE_SIZE < sortedMembers.length ? prev + 1 : prev
  )
}
disabled={currentPage * PAGE_SIZE >= sortedMembers.length}
className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
>
Next
</button>
</div>
</div>
);
}
