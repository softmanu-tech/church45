import { NextResponse } from 'next/server';
import { requireSessionAndRoles } from "@/lib/authMiddleware";

export async function GET(request: Request) {
  try {
    const { user } = await requireSessionAndRoles(request, ['leader']);
    
    // Get filters from query params
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Fetch data using the authenticated user's groupId
    const data = await fetchLeaderData({
      groupId: user.groupId, // Should be populated in requireSessionAndRoles
      eventId,
      fromDate,
      toDate
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}