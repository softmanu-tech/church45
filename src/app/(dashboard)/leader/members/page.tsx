export default function LeaderDashboard() {
    // ... existing state declarations
  
    // Extract fetch logic into a reusable function
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedEventId) params.append('eventId', selectedEventId);
        if (fromDate) params.append('fromDate', fromDate);
        if (toDate) params.append('toDate', toDate);
  
        const res = await fetch(`/api/leader?${params.toString()}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
  
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch data');
        }
  
        const json: DashboardResponse = await res.json();
        setData(json);
        setCurrentPage(1);
      } catch (err) {
        console.error('Fetch error:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
  
    // Update useEffect to use the extracted function
    useEffect(() => {
      console.log("DEBUG - Filter changes detected:", { selectedEventId, fromDate, toDate });
      fetchData();
    }, [selectedEventId, fromDate, toDate]);
  
    // ... rest of the component remains the same
  }