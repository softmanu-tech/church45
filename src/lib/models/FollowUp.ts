import mongoose from 'mongoose';

const FollowUpSchema = new mongoose.Schema({
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['visit', 'call', 'message'], required: true },
    date: { type: Date, default: Date.now },
    note: { type: String },
}, { timestamps: true });

export default mongoose.models.FollowUp || mongoose.model('FollowUp', FollowUpSchema);