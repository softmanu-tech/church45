// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

interface AuthToken {
  role?: 'bishop' | 'leader';
  email?: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loginUrl = new URL('/login', request.url);
  const leaderDashboardUrl = new URL('/leader', request.url);
  const bishopDashboardUrl = new URL('/bishop/dashboard', request.url);

  try {
    // Allow API routes, login/logout pages without auth
    if (
      pathname.startsWith('/api') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/logout')
    ) {
      return NextResponse.next();
    }

    const token = await getToken({ req: request }) as AuthToken | null;

    if (!token) {
      // Redirect to login with callback
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based access control
    if (pathname.startsWith('/bishop') && token.role !== 'bishop') {
      return NextResponse.redirect(leaderDashboardUrl);
    }

    if (pathname.startsWith('/leader') && token.role !== 'leader') {
      return NextResponse.redirect(bishopDashboardUrl);
    }

    // Allow all other authenticated routes
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    loginUrl.searchParams.set('error', 'middleware_failure');
    return NextResponse.redirect(loginUrl);
  }
}
