import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })

  // Check if the user is authenticated
  if (!token) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Allow the request to continue
  return NextResponse.next()
}

// Apply this middleware to dashboard routes
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/leader/:path*",
    "/admin/:path*",
    "/member/:path*",
    "/api/leader/:path*",
    "/api/members/:path*",
    "/api/events/:path*",
    "/api/attendance/:path*",
  ],
}
