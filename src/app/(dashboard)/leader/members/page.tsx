export function CreateMemberForm({ groupId, leaderId, onMemberCreated }: CreateMemberFormProps) {
    // ...existing state and functions
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
  
      try {
        // ... fetch member creation
  
        toast.success("Member created successfully!");
        onMemberCreated(); // Call callback to notify parent
      } catch (error) {
        // error handling
      } finally {
        setLoading(false);
      }
    }
  
    // ...return form JSX
  }
  