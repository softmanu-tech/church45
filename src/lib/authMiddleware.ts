// lib/authMiddleware.ts
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";

/**
 * Middleware to require authentication and a specific role.
 * @param request - The Next.js request object.
 * @param requiredRole - The role you want to enforce (e.g., 'bishop', 'leader').
 */
export async function requireSessionAndRole(request: Request, requiredRole: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== requiredRole) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { session };
}
