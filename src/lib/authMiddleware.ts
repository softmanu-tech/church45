import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function requireSessionAndRole(
  req: NextRequest,
  requiredRole: string
): Promise<{ session: { user: { id: string; role?: string; email?: string } } } | null> {
  const token = await getToken({ req });

  if (!token || token.role !== requiredRole) {
    return null;
  }

  return {
    session: {
      user: {
        id: token.id as string,
        role: token.role as string,
        email: token.email as string,
      },
    },
  };
}
