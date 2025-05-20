import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    return NextResponse.redirect('/login');
  }

  try {
    const payload = await verifyToken(token);
    // Now safely use payload.id, payload.email, etc.
    
  } catch (err) {
    return NextResponse.redirect('/login?error=invalid_token');
  }
}