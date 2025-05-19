useEffect(() => {
  if (!userId) return; // Still check if userId exists (from session)

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Only send FILTER params (not userId/groupId)
      if (selectedEventId) params.append('eventId', selectedEventId);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);

      const res = await fetch(`/api/leader?${params.toString()}`, {
        credentials: 'include' // Send cookies for JWT
      });

      if (!res.ok) throw new Error(await res.text());
      
      setData(await res.json());
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [userId, selectedEventId, fromDate, toDate]); // Remove groupId from deps