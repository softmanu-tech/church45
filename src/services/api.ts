import { FilterQuery } from 'mongoose';
import { IAttendance } from '@/lib/models/Attendance';
import { IEvent } from '@/lib/models/Event';

// ✅ Strongly typed attendance filter
const attendanceFilter: FilterQuery<IAttendance> = {
  group: leader.group._id,
};

if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
  attendanceFilter.event = new mongoose.Types.ObjectId(eventId);
}

if (fromDate || toDate) {
  attendanceFilter.date = {};
  if (fromDate) attendanceFilter.date.$gte = new Date(fromDate);
  if (toDate) attendanceFilter.date.$lte = new Date(toDate);
}

const attendanceRecords = await Attendance.find(attendanceFilter).lean<IAttendance[]>();

// ✅ Strongly typed event filter
const eventFilter: FilterQuery<IEvent> = {
  group: leader.group._id,
};

if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
  eventFilter._id = new mongoose.Types.ObjectId(eventId);
}
