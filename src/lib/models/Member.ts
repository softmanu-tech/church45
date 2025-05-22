import mongoose, { Schema, Document, Model } from "mongoose"
import bcrypt from "bcrypt"

export interface IMember extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  phone?: string
  department?: string
  location?: string
  group: mongoose.Types.ObjectId // Reference to Group collection
  role: "member" | "leader"
  password: string
  createdAt: Date
  updatedAt: Date
  leader: mongoose.Types.ObjectId // Reference to User collection
}

const MemberSchema: Schema<IMember> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, match: /.+\@.+\..+/ },
    phone: { type: String },
    department: { type: String },
    location: { type: String },
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    leader: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true, enum: ["member", "leader"] },
    password: { type: String, required: true },
  },
  { timestamps: true }
)

// Password hashing middleware
MemberSchema.pre<IMember>("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
    console.log
  } else {
    next(new Error("Unknown error during password hashing"))

  }
})

const Member: Model<IMember> = mongoose.models.Member || mongoose.model<IMember>("Member", MemberSchema)
export default Member
