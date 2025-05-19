export async function GET(request: Request) {
  try {
    await dbConnect();
    
    // Debug: Log entire request
    console.log('\n=== Incoming Request ===');
    console.log('URL:', request.url);

    // Get both JWT auth AND query params
    const session = await requireSessionAndRoles(request, ['leader']);
    const { searchParams } = new URL(request.url);
    
    // Debug: Log all parameters
    console.log('Query params:', Object.fromEntries(searchParams.entries()));
    console.log('Session user:', session?.user?.id);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rest of your existing logic...
  }
}