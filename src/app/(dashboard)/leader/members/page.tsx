<CreateMemberForm
  groupId={data.group._id}
  onMemberCreated={() => {
    setOpenAddMember(false);
    fetchData(); // Refresh member list
  }}
/>
