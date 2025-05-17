



// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET!;
const secret = new TextEncoder().encode(JWT_SECRET);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;

  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    if (req.nextUrl.pathname === "/") {
      const redirectTo = role === "bishop"
        ? "/bishop/dashboard"
        : role === "leader"
        ? "/leader"
        : "/login";

      return NextResponse.redirect(new URL(redirectTo, req.url));
    }
  } catch (err) {
    return NextResponse.redirect(new URL("/login", req.url));
    console.error("JWT verification failed:", err);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"], // only apply middleware to /dashboard
};
