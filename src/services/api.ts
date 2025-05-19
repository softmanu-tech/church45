// In your API route (`app/api/leader/route.ts`):
export async function GET(request: Request) {
  const session = await requireSessionAndRoles(request, ['leader']);
  const { searchParams } = new URL(request.url);

  // Use URL params as fallback (for debugging only - remove in production)
  const userId = session?.user?.id || searchParams.get('userId');
  const groupId = searchParams.get('groupId'); 

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ...
}