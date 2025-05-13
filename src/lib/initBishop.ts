import { User } from '@/lib/models/User';

import bcrypt from 'bcryptjs'
import dbConnect from './dbConnect';

export const initBishop = async () => {
    await dbConnect()
    const email = process.env.BISHOP_EMAIL
    const password = process.env.BISHOP_PASSWORD
    if (!email || !password) return

    const exists = await User.findOne({ email })
    if (!exists) {
        const hash = await bcrypt.hash(password, 10)
        await User.create({
            name: "Bishop",
            email,
            password: hash,
            role: "bishop"
        })
        console.log("✅ Bishop account created")
    }
}
