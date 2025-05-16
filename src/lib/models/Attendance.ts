// src/lib/models/Attendance.ts
import mongoose, { Schema, Document, Model, models } from 'mongoose';

// TypeScript interface for the Attendance document
export interface IAttendance extends Document {
    event?: mongoose.Types.ObjectId;
    group: mongoose.Types.ObjectId;
    date: Date;
    count?: number;
    presentMembers: mongoose.Types.ObjectId[];
    absentMembers: mongoose.Types.ObjectId[];
    recordedBy: mongoose.Types.ObjectId;
    updatedBy: mongoose.Types.ObjectId;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    presentCount: number;
    absentCount: number;
    getAttendancePercentage?: () => number;
    _id: mongoose.Types.ObjectId;
}

// Mongoose schema definition
const AttendanceSchema: Schema = new Schema(
    {
        event: {
            type: Schema.Types.ObjectId,
            ref: 'Event',
            required: false,
        },
        group: {
            type: Schema.Types.ObjectId,
            ref: 'Group',
            required: [true, 'Group reference is required'],
        },
        date: {
            type: Date,
            required: [true, 'Attendance date is required'],
            default: Date.now,
        },
        presentMembers: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }],
        absentMembers: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }],
        recordedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Recorder information is required'],
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Updater information is required'],
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [500, 'Notes cannot exceed 500 characters'],
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt fields
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes for better query performance
AttendanceSchema.index({ event: 1 });
AttendanceSchema.index({ group: 1 });
AttendanceSchema.index({ date: 1 });
AttendanceSchema.index({ recordedBy: 1 });
AttendanceSchema.index({ 'presentMembers': 1 });
AttendanceSchema.index({ 'absentMembers': 1 });

// Define interface for model to include static methods
interface AttendanceModel extends Model<IAttendance> {
    findByEvent(eventId: string): Promise<IAttendance[]>;
    findByGroup(groupId: string): Promise<IAttendance[]>;
    findByMember(memberId: string): Promise<IAttendance[]>;
}

// Static methods
AttendanceSchema.statics.findByEvent = async function(eventId: string) {
    return this.find({ event: eventId }).sort({ date: -1 });
};

AttendanceSchema.statics.findByGroup = async function(groupId: string) {
    return this.find({ group: groupId }).sort({ date: -1 });
};

AttendanceSchema.statics.findByMember = async function(memberId: string) {
    return this.find({
        $or: [
            { presentMembers: memberId },
            { absentMembers: memberId }
        ]
    }).sort({ date: -1 });
};

// Instance methods
AttendanceSchema.methods.getAttendancePercentage = function() {
    const totalMembers = this.presentMembers.length + this.absentMembers.length;
    return totalMembers > 0
        ? Math.round((this.presentMembers.length / totalMembers) * 100)
        : 0;
};

// Virtual for presentCount
AttendanceSchema.virtual('presentCount').get(function(this: IAttendance) {
    return this.presentMembers.length;
});

// Virtual for absentCount
AttendanceSchema.virtual('absentCount').get(function(this: IAttendance) {
    return this.absentMembers.length;
});

// Create and export the model - FIX the type error here
const AttendanceModel = (models.Attendance ||
    mongoose.model<IAttendance, AttendanceModel>('Attendance', AttendanceSchema)) as AttendanceModel;

export const Attendance = AttendanceModel;