const attendanceRecords = await Attendance.find(attendanceFilter).lean<AttendanceRecord[]>();
const members = await User.find({ group: leader.group._id, role: 'member' })
  .select('name email phone')
  .lean<Member[]>();










  attendanceRecords.forEach((record) => {
    record.presentMembers?.forEach((memberId) => {
      const idStr = memberId.toString();
      if (memberAttendanceMap.has(idStr)) {
        const data = memberAttendanceMap.get(idStr)!;
        data.count += 1;
        if (!data.lastDate || record.date > data.lastDate) {
          data.lastDate = record.date;
        }
        memberAttendanceMap.set(idStr, data);
      }
    });
  });
  