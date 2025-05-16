// lib/authMiddleware.ts
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function requireSessionAndRole(request: Request, expectedRole: string) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    throw new Error('Unauthorized: No session token');
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    if (payload.role !== expectedRole) {
      throw new Error('Unauthorized: Insufficient role');
    }

    return { user: payload }; // id, email, role
  } catch (error) {
    console.error('JWT verification failed:', error);
    throw new Error('Unauthorized: Invalid token');
  }
}
