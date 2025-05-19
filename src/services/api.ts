const fetchData = async () => {
  setLoading(true);
  try {
    const params = new URLSearchParams();
    
    // Only pass filter params, not userId/groupId
    if (selectedEventId) params.append('eventId', selectedEventId);
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);

    
    const res = await fetch(`/api/leader?${params.toString()}`, {
      credentials: 'include' // Ensure cookies are sent
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to fetch data');
    }

    const json = await res.json();
    setData(json);
  } catch (err) {
    console.error('Fetch error:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};