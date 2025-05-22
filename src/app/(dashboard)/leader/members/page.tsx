// In CreateMemberForm component
<form onSubmit={handleSubmit} className="space-y-4">
  {/* Form fields */}

  <div className="flex gap-2 justify-end">
    <button
      type="button"
      onClick={() => onMemberCreated()} // Close without submitting
      className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
      disabled={loading}
    >
      Cancel
    </button>
    
    <button
      type="submit"
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      disabled={loading}
    >
      {loading ? "Creating..." : "Create Member"}
    </button>
  </div>
</form>