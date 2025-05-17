import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET not set');
const secret = new TextEncoder().encode(JWT_SECRET);

interface AuthToken {
  id: string;
  email: string;
  role: 'bishop' | 'leader';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loginUrl = new URL('/login', request.url);
  const leaderDashboardUrl = new URL('/dashboard/leader', request.url);
  const bishopDashboardUrl = new URL('/dashboard/bishop', request.url);

  try {
    // Get token from cookie
    const cookie = request.cookies.get('auth_token')?.value;

    if (!cookie) {
      if (!pathname.startsWith('/login')) {
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }

    // Verify token
    const { payload } = await jwtVerify(cookie, secret);
    const token = payload as AuthToken;

    // Bishop-only routes
    if (pathname.startsWith('/bishop')) {
      if (token.role !== 'bishop') {
        return NextResponse.redirect(leaderDashboardUrl);
      }
      return NextResponse.next();
    }

    // Leader-only routes
    if (pathname.startsWith('/leader')) {
      if (token.role !== 'leader') {
        return NextResponse.redirect(bishopDashboardUrl);
      }
      return NextResponse.next();
    }

    // Other protected routes
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    loginUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/bishop/:path*',
    '/leader/:path*',
    '/api/bishop/:path*',
    '/api/leader/:path*',
  ],
};
