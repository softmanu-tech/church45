// lib/authMiddleware.ts
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function requireSessionAndRole(
  req: NextRequest | Request,
  requiredRole: string
): Promise<{
  user: { id: string; role: string; email: string };
}> {
  const token = await getToken({ req: req as NextRequest });
  console.log("🔑 Token:", token);

  if (!token) {
    console.error("❌ No token found.");
    throw new Error("Unauthorized: No session token");
  }

  console.log("🔑 Token contents:", token);

  if (!token.email || !token.id || !token.role) {
    throw new Error("Unauthorized: Missing token fields");
  }

  if (token.role !== requiredRole) {
    throw new Error(`Forbidden: Required role '${requiredRole}', but got '${token.role}'`);
  }

  return {
    user: {
      id: token.id as string,
      role: token.role as string,
      email: token.email as string,
    },
  };
}
