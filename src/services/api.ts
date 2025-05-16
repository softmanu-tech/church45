// Example: Group-wise attendance stats
const groups = await Group.find().populate("leaders");

const detailedStats = await Promise.all(
  groups.map(async (group) => {
    const memberCount = await User.countDocuments({ group: group._id, role: "member" });
    const eventCount = await Event.countDocuments({ group: group._id });
    const attendanceCount = await Attendance.countDocuments({ group: group._id });

    return {
      groupId: group._id.toString(),
      groupName: group.name,
      leader: group.leader?.name,
      memberCount,
      eventCount,
      attendanceCount,
    };
  })
);
