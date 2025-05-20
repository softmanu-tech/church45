import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken } from '@/lib/shared/jwt';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;
  const loginUrl = new URL('/login', request.url);

  // 1. Handle missing token
  if (!token) {
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 2. Verify token using centralized function
    const payload = await verifyToken(token);

    // 3. Create redirect URLs
    const leaderDashboardUrl = new URL('/dashboard/leader', request.url);
    const bishopDashboardUrl = new URL('/dashboard/bishop', request.url);

    // 4. Role-based route protection
    if (pathname.startsWith('/bishop') || pathname.startsWith('/api/bishop')) {
      if (payload.role !== 'bishop') {
        return NextResponse.redirect(leaderDashboardUrl);
      }
      return NextResponse.next();
    }

    if (pathname.startsWith('/leader') || pathname.startsWith('/api/leader')) {
      if (payload.role !== 'leader') {
        return NextResponse.redirect(bishopDashboardUrl);
      }
      return NextResponse.next();
    }

    // 5. Protect dashboard routes
    if (pathname.startsWith('/dashboard')) {
      const dashboardUrl = payload.role === 'bishop' 
        ? bishopDashboardUrl 
        : leaderDashboardUrl;
      return NextResponse.redirect(dashboardUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    loginUrl.searchParams.set('error', 'invalid_token');
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