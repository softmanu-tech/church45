// app/api/bishop/leader/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import { requireSessionAndRoles } from "@/lib/authMiddleware";
import { User } from "@/lib/models/User";

export async function POST(req: NextRequest) {
  const auth = await requireSessionAndRoles(req, ["bishop"]);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, password, groupId } = await req.json();

  try {
    await dbConnect();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const leader = new User({
      name,
      email,
      password: hashedPassword,
      role: "leader",
      group: groupId,
    });

    await leader.save();

    // TODO: Send email here with credentials (optional)

    return NextResponse.json({ message: "Leader created successfully" });
  } catch (error) {
    console.error("Error creating leader:", error);
    return NextResponse.json({ error: "Failed to create leader" }, { status: 500 });
  }
}
