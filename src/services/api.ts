const attendanceRecords = await Attendance.find(attendanceFilter).lean<AttendanceRecord[]>();
const members = await User.find({ group: leader.group._id, role: 'member' })
  .select('name email phone')
  .lean<Member[]>();
