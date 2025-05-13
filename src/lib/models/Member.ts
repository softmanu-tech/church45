// lib/models/Member.ts
import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.models.Member || mongoose.model('Member', MemberSchema);