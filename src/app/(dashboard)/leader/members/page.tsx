if (!res.ok) {
    let errorMessage = "Failed to create member";
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorMessage;
    } catch (_) {}
    throw new Error(errorMessage);
  }
  