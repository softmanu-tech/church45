{Array.isArray(groups) && groups.map((group) => (
    <option key={group._id} value={group._id}>
        {group.name}
    </option>
))}
