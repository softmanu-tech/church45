const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          department,
          location,
          group: groupId, // Use the groupId passed as a prop
          role,
          password,
          leader: leaderId, // Automatically assign the leader's ID
        }),
      });
  
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create member");
      }
  
      // Reset form fields
      setName("");
      setEmail("");
      setPhone("");
      setDepartment("");
      setLocation("");
      setRole("");
      setPassword("");
  
      toast.success("Member created successfully!");
      onMemberCreated(); // Call the onMemberCreated function to refresh the member list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create member");
      console.error("Error creating member:", error);
    } finally {
      setLoading(false);
    }
  };
  