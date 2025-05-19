const { searchParams } = new URL(req.url);
const groupId = searchParams.get('groupId') || undefined; // Fallback
if (!groupId) return NextResponse.json({ error: "Missing groupId" }, { status: 400 });