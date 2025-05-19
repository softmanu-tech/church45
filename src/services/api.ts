// Add null checks for critical data
if (!attendanceRecords || !events || !rawMembers) {
    return NextResponse.json({ error: "Data fetch failed" }, { status: 500 });
  }