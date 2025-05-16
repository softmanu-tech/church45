import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET not set in environment");

const secret = new TextEncoder().encode(JWT_SECRET);

export async function requireSessionAndRole(
  req: NextRequest | Request,
  requiredRole: string
): Promise<{
  user: { id: string; role: string; email: string };
}> {
  const cookieHeader =
    req instanceof Request ? req.headers.get("cookie") : req.headers.get("cookie");

  const token = cookieHeader
    ?.split(";")
    .find((cookie : string) => cookie.trim().startsWith("auth_token="))
    ?.split("=")[1];

  console.log("🔑 Token from cookie:", token);

  if (!token) {
    console.error("❌ No token found.");
    throw new Error("Unauthorized: No session token");
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    console.log("✅ Decoded JWT payload:", payload);

    const id = payload.id as string;
    const email = payload.email as string;
    const role = payload.role as string;

    if (!id || !email || !role) {
      throw new Error("Unauthorized: Missing token fields");
    }

    if (role !== requiredRole) {
      throw new Error(`Forbidden: Required role '${requiredRole}', but got '${role}'`);
    }

    return { user: { id, email, role } };
  } catch (err) {
    console.error("❌ JWT verification failed:", err);
    throw new Error("Unauthorized: Invalid token");
  }
}
