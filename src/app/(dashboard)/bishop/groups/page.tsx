'use client';
import { useEffect, useState } from 'react';

interface Group {
    _id: string;
    name: string;
    members: [];

}

export default function GroupManagement() {
    const [groups, setGroups] = useState([]);
    const [groupName, setGroupName] = useState('');

    const fetchGroups = async () => {
        const res = await fetch('/api/bishop/groups');
        const data = await res.json();
        setGroups(data.groups);
    };

    const createGroup = async () => {
        await fetch('/api/bishop/groups', {
            method: 'POST',
            body: JSON.stringify({ name: groupName }),
        });
        setGroupName('');
        await fetchGroups();
    };

    const deleteGroup = async (id: string) => {
        await fetch(`/api/bishop/groups/${id}`, { method: 'DELETE' });
        await fetchGroups();
    };

    useEffect(() => {
        fetchGroups().then();
    }, []);

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-4">
            <h1 className="text-2xl font-bold text-white">Groups</h1>

            <div className="bg-blue-500 p-4 rounded-xl space-y-2">
                <input placeholder="Group Name" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="input" />
                <button onClick={createGroup} className="btn">Add Group</button>
            </div>

            <ul className="space-y-2">
                {groups.map((group: Group) => (
                    <li key={group._id} className="bg-blue-950 p-3 rounded shadow flex justify-between items-center">
                        <span>{group.name}</span>
                        <span>{group.members}</span>
                        <button onClick={() => deleteGroup(group._id)} className="text-red-600">Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
