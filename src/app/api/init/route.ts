// app/api/init/route.ts
import { initBishop } from '@/lib/initBishop'
import { NextResponse } from 'next/server'

export async function GET() {
    await initBishop()
    return NextResponse.json({ message: "Bishop initialized" })
}
