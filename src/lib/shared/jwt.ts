import { jwtVerify } from "jose";

// 1. Edge-compatible secret encoding
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET not set in environment variables");

// Using direct string as secret (jose will handle encoding)
const secret = JWT_SECRET;

// 2. Type definitions
export interface AuthPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// 3. Main verification function
export async function verifyToken(token: string): Promise<AuthPayload> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    
    // Type-safe validation
    if (typeof payload !== 'object' || payload === null) {
      throw new Error("Invalid token payload");
    }

    const { id, email, role } = payload as Record<string, unknown>;
    
    if (typeof id !== 'string' || 
        typeof email !== 'string' || 
        typeof role !== 'string') {
      throw new Error("Token missing required fields");
    }

    return { id, email, role };
  } catch (err) {
    console.error("JWT verification failed:", err);
    throw new Error("Invalid token");
  }
}