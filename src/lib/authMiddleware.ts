// src/lib/authMiddleware.ts
import { NextRequest } from "next/server";
import { verifyToken, type AuthPayload } from "@/lib/shared/jwt";

export async function requireSessionAndRoles(
  req: NextRequest | Request,
  allowedRoles: string[]
): Promise<{ user: AuthPayload }> {
  try {
    // 1. Extract token from cookies
    const cookieHeader = req.headers.get("cookie");
    const token = cookieHeader
      ?.split(";")
      .find((cookie) => cookie.trim().startsWith("auth_token="))
      ?.split("=")[1];

    console.log("🔑 Token from cookie:", token?.slice(0, 10) + "..."); // Log partial token for security

    if (!token) {
      throw new Error("Unauthorized: No token provided");
    }

    // 2. Use centralized token verification
    const payload = await verifyToken(token);
    console.log("✅ Verified JWT payload for:", payload.email);

    // 3. Validate role
    if (!allowedRoles.includes(payload.role)) {
      const err = new Error(`Forbidden: Role ${payload.role} not allowed`);
      err.name = "Forbidden";
      throw err;
    }

    return { 
      user: {
        id: payload.id,
        email: payload.email,
        role: payload.role
      }
    };
  } catch (err: unknown) {
    console.error("❌ Authentication error:", err);

    // 4. Proper error type narrowing
    if (err instanceof Error && err.name === "Forbidden") {
      throw err; // Preserve Forbidden errors
    }
    throw new Error("Unauthorized: Invalid credentials");
  }
}