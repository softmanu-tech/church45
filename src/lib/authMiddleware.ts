import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET not set in environment");

const secret = new TextEncoder().encode(JWT_SECRET);

export async function requireSessionAndRoles(
  req: NextRequest | Request,
  allowedRoles: string[]
): Promise<{
  user: { id: string; role: string; email: string };
}> {
  const headers = (req as Request).headers;
  const cookieHeader = headers.get("cookie");

  const token = cookieHeader
    ?.split(";")
    .find((cookie) => cookie.trim().startsWith("auth_token="))
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

    if (!allowedRoles.includes(role)) {
      throw new Error(
        `Forbidden: Requires one of [${allowedRoles.join(", ")}], but got '${role}'`
      );
    }

    return { user: { id, email, role } };
  } catch (err) {
    console.error("❌ JWT verification failed:", err);
    throw new Error("Unauthorized: Invalid token");
  }
}
