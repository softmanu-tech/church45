// src/lib/authMiddleware.ts
import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET not set");

const secret = new TextEncoder().encode(JWT_SECRET);

export async function requireSessionAndRoles(
  req: NextRequest | Request,
  allowedRoles: string[]
): Promise<{ user: { id: string; email: string; role: string } }> {
  const cookieHeader = req.headers.get("cookie");
  const token = cookieHeader
    ?.split(";")
    .find((cookie) => cookie.trim().startsWith("auth_token="))
    ?.split("=")[1];

  console.log("🔑 Token from cookie:", token);

  if (!token) throw new Error("Unauthorized");

  try {
    const { payload } = await jwtVerify(token, secret);
    const { id, email, role } = payload as {
      id: string;
      email: string;
      role: string;
    };

    console.log("✅ Decoded JWT payload:", payload);

    if (!allowedRoles.includes(role)) {
      const err = new Error("Forbidden");
      err.name = "Forbidden";
      throw err;
    }

    return { user: { id, email, role } };
  } catch (err: any) {
    if (err.name === "Forbidden") throw err;
    console.error("❌ JWT verification failed:", err);
    throw new Error("Unauthorized");
  }
}
