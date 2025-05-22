export async function POST(request: Request) {
    try {
      await dbConnect();
  
      const {
        name,
        email,
        phone,
        department,
        location,
        groupId,
        role,
        password,
      } = await request.json();
  
      const { user } = await requireSessionAndRoles(request, ['leader']);
      if (!user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      // Fetch group including leader field
      const group = await Group.findById(groupId).populate('leader');
      if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }
      if (!group.leader) {
        return NextResponse.json({ error: 'Group leader not defined' }, { status: 400 });
      }
  
      // Validate required fields for member creation
      if (!name || !email || !role || !department || !location || !password) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
      }
  
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create member with leader assigned from the group's leader field
      const newMember = new Member({
        name,
        email,
        phone,
        department,
        location,
        group: group._id,
        role,
        password: hashedPassword,
        leader: group.leader._id,    // <-- Assign leader from group's leader
      });
  
      await newMember.save();
  
      // Add member ref to group's members array
      group.members.push(newMember._id);
      await group.save();
  
      return NextResponse.json({
        _id: newMember._id.toString(),
        name: newMember.name,
        email: newMember.email,
        phone: newMember.phone,
        department: newMember.department,
        location: newMember.location,
        role: newMember.role,
        leader: newMember.leader,
      });
    } catch (error) {
      console.error('Error adding member:', error);
      return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
    }
  }
  