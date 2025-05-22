<div>
    <label className="block text-sm font-semibold mb-1">Role</label>
    <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
    >
        <option value="">Select a role</option>
        <option value="member">Member</option>
        <option value="leader">Leader</option>
        <option value="bishop">Bishop</option>
    </select>
</div>
