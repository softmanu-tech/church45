export async function GET(req: NextRequest) { // Use NextRequest
    const session = await requireSessionAndRoles(req, ['leader']); // Pass NextRequest
    if (!session?.user?.id) return NextResponse.unauthorized();
  }