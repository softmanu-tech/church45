// src/lib/models/Event.ts
import mongoose, {Schema, Document, Model, models, model} from 'mongoose'
import { Group } from './Group'
import { User} from './User'

// TypeScript interface for the Event document
export interface IEvent extends Document {
    _id: string
    title: string
    date: Date
    description?: string
    group: mongoose.Types.ObjectId | typeof Group
    createdBy: mongoose.Types.ObjectId | typeof User
    attendees?: mongoose.Types.ObjectId[] | typeof User[]
    createdAt: Date
    updatedAt: Date
}

// Mongoose schema definition
const EventSchema: Schema<IEvent> = new Schema(
    {
        title: {
            type: String,
            required: [true, 'Event title is required'],
            trim: true,
            maxlength: [100, 'Event title cannot exceed 100 characters'],
        },
        date: {
            type: Date,
            required: [true, 'Event date is required'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        group: {
            type: Schema.Types.ObjectId,
            ref: 'Group',
            required: [true, 'Event must belong to a group'],
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Event creator is required'],
        },
        attendees: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
    },
    {
        timestamps: true, // Adds createdAt and updatedAt fields
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
)

// Indexes for better query performance
EventSchema.index({ group: 1 })
EventSchema.index({ createdBy: 1 })
EventSchema.index({ date: 1 })

// Virtual populate for attendance records
EventSchema.virtual('attendance', {
    ref: 'Attendance',
    localField: '_id',
    foreignField: 'event',
})

// Pre-save hook to validate data
EventSchema.pre<IEvent>('save', async function (next) {
    // Validate group exists
    const group = await Group.findById(this.group)
    if (!group) {
        throw new Error('Referenced group does not exist')
    }

    // Validate creator exists
    const creator = await User.findById(this.createdBy)
    if (!creator) {
        throw new Error('Referenced user does not exist')
    }

    next()
})

// Static methods
interface EventModel extends Model<IEvent> {
    findByGroup(groupId: string): Promise<IEvent[]>
}

EventSchema.statics.findByGroup = async function (groupId: string) {
    return this.find({ group: groupId }).sort({ date: 1 })
}

// Instance methods
EventSchema.methods.getUpcomingEvents = function () {
    return this.model('Event').find({
        date: { $gte: new Date() },
        group: this.group
    }).sort({ date: 1 })
}

// Create and export the model
export const Event = models.Event  || model<IEvent, EventModel>('Event', EventSchema)



