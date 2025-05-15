// lib/authMiddleware.ts
import { getServerSession } from "next-auth";
import { authOptions } from "./auth"; // adjust if path is different
import { NextRequest } from "next/server";

export async function requireSessionAndRole(
  req: NextRequest,
  requiredRole: string
): Promise<{ session: Awaited<ReturnType<typeof getServerSession>> } | null> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== requiredRole) {
    return null;
  }

  return { session };
}
