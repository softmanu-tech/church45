useEffect(() => {
    const fetchGroups = async () => {
        try {
            const response = await fetch("/api/bishop/groups"); // Ensure this is the correct endpoint
            if (!response.ok) {
                throw new Error("Failed to fetch groups");
            }
            const data = await response.json();
            if (data.success) {
                setGroups(data.groups); // Set groups to the array from the response
            } else {
                throw new Error(data.error || "Failed to fetch groups");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to fetch groups");
            console.error("Error fetching groups:", error);
        }
    };

    fetchGroups();
}, []);
