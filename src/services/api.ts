import { IAttendance } from '@/lib/models/Attendance';

// Replace `any` with correct interface
const attendanceFilter: Partial<Pick<IAttendance, 'group' | 'event' | 'date'>> & { group: mongoose.Types.ObjectId } = {
  group: leader.group._id,
};

// Properly typed iteration
attendanceRecords.forEach((record: IAttendance) => {
  record.presentMembers?.forEach((memberId: mongoose.Types.ObjectId) => {
    // ...
  });
});
