// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Type for the JWT token with role information
interface AuthToken {
    role?: 'bishop' | 'leader';
    email?: string;
    // Add other token properties you expect
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const loginUrl = new URL('/login', request.url);
    const leaderDashboardUrl = new URL('/dashboard/leaders', request.url);
    const bishopDashboardUrl = new URL('/dashboard/bishop', request.url);

    try {
        // Get token from the request
        const token = await getToken({ req: request }) as AuthToken | null;

        // 1. Authentication Check
        if (!token) {
            if (!pathname.startsWith('/login')) {
                // Add redirect URL for post-login redirect
                loginUrl.searchParams.set('callbackUrl', pathname);
                return NextResponse.redirect(loginUrl);
            }
            return NextResponse.next();
        }

        // 2. Authorization Check
        if (pathname.startsWith('/bishop')) {
            if (token.role !== 'bishop') {
                return NextResponse.redirect(leaderDashboardUrl);
            }
            return NextResponse.next();
        }

        if (pathname.startsWith('/leaders')) {
            if (token.role !== 'leader') {
                return NextResponse.redirect(bishopDashboardUrl);
            }
            return NextResponse.next();
        }

        // Default allow for other /dashboard routes if authenticated
        return NextResponse.next();

    } catch (error) {
        console.error('Middleware error:', error);

        loginUrl.searchParams.set('error', 'middleware_failure');
        return NextResponse.redirect(loginUrl);
    }
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        // Add other paths you want to protect
    ],
};