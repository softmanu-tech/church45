// Create interfaces for clarity
interface AttendanceRecord {
    date: Date;
    presentMembers: mongoose.Types.ObjectId[];
  }
  
  interface Member {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    phone: string;
  }
  