<CreateMemberForm
  groupId={data.group._id}
  leaderId={user.id}
  onMemberCreated={() => {
    setOpenAddMember(false);
    fetchData(); // Refresh member list
  }}
/>
