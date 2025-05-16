// lib/authMiddleware.ts
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { User } from "./models/User";
import dbConnect from "./dbConnect";

export async function requireSessionAndRole(
  req: NextRequest | Request,
  requiredRole: string
): Promise<{ user: Awaited<ReturnType<typeof User.findOne>> }> {
  const token = await getToken({ req: req as NextRequest });

  if (!token || !token.email) {
    throw new Error("Unauthorized: Missing token or email");
  }

  await dbConnect();

  const user = await User.findOne({ email: token.email });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== requiredRole) {
    throw new Error("Forbidden: Insufficient role");
  }

  return { user };
}
