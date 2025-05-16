export async function requireSessionAndRole(
  req: Request | NextRequest,
  requiredRole: string | string[]
) {
  const session = await getToken({ req });

  if (!session?.id) {
    throw new Error('Unauthorized');
  }

  const userRole = session.role;

  const isAuthorized = Array.isArray(requiredRole)
    ? requiredRole.includes(userRole)
    : userRole === requiredRole;

  if (!isAuthorized) {
    throw new Error('Forbidden');
  }

  return { session: { user: { id: session.id, role: userRole, email: session.email } } };
}
