// Fetch raw members from DB
const rawMembers = await User.find({
    group: leader.group._id,
    role: 'member',
  })
    .select('name email phone')
    .lean<IUser[]>();
  
  // Filter only members with valid phones (no type predicate needed)
  const members: Member[] = rawMembers
    .filter((m) => typeof m.phone === 'string') // ensures m.phone is string
    .map((m) => ({
      _id: m._id,
      name: m.name,
      email: m.email,
      phone: m.phone as string, // safely asserted after filter
    }));
  