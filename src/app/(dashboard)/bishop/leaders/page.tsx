"use client"
import { useState, useEffect } from "react"

interface Group {
    _id: string
    name: string
}

interface Leader {
    _id: string
    name: string
    email: string
    password?: string
    group?: {
        _id: string
        name: string
    }
}

export default function LeaderManagement() {
    const [leaders, setLeaders] = useState<Leader[]>([])
    const [groups, setGroups] = useState<Group[]>([])
    const [form, setForm] = useState({ name: "", email: "", password: "", groupId: "" })
    const [isLoading, setIsLoading] = useState(false)

    const fetchLeaders = async () => {
        const res = await fetch("/api/bishop/leaders")
        const data = await res.json()
        setLeaders(data.leaders)
    }

    const fetchGroups = async () => {
        try {
            const res = await fetch("/api/bishop/groups")
            const data = await res.json()
            setGroups(data.groups)
        } catch (err) {
            console.error("Error fetching groups:", err)
        }
    }

    const createLeader = async () => {
        if (!form.name || !form.email || !form.password || !form.groupId) {
            return alert("Please fill all fields")
        }

        setIsLoading(true)
        try {
            const res = await fetch("/api/bishop/leaders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })

            if (res.ok) {
                setForm({ name: "", email: "", password: "", groupId: "" })
                await fetchLeaders()
            } else {
                const error = await res.json()
                alert(`Error: ${error.message || "Failed to create leader"}`)
            }
        } catch (err) {
            console.error("Error creating leader:", err)
            alert("An error occurred while creating the leader")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        Promise.all([fetchLeaders(), fetchGroups()]).catch((err) => console.error("Error initializing data:", err))
    }, [])

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-4">
            <h1 className="text-2xl font-bold text-white">Create Leader & Login</h1>

            <div className="bg-blue-950 p-4 rounded-xl space-y-2">
                <input
                    placeholder="Leader Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input w-full p-2 rounded"
                />
                <input
                    placeholder="Email (for login)"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input w-full p-2 rounded"
                />
                <input
                    type="password"
                    placeholder="Password (for login)"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input w-full p-2 rounded"
                />

                <select
                    value={form.groupId}
                    onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                    className="input w-full p-2 rounded bg-white text-black"
                >
                    <option value="">Select a Group</option>
                    {groups.map((group) => (
                        <option key={group._id} value={group._id}>
                            {group.name}
                        </option>
                    ))}
                </select>

                <button
                    onClick={createLeader}
                    className="btn w-full p-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition"
                    disabled={isLoading}
                >
                    {isLoading ? "Creating..." : "Create Leader & Assign Group"}
                </button>
            </div>

            <ul className="space-y-2">
                {leaders.map((leader: Leader) => (
                    <li key={leader._id} className="bg-blue-900 p-3 rounded shadow flex justify-between items-center">
            <span>
              {leader.name} ({leader.email}) - Group: {leader.group?.name}
            </span>
                        <button
                            onClick={async () => {
                                if (confirm(`Are you sure you want to delete ${leader.name}?`)) {
                                    await fetch(`/api/bishop/leaders/${leader._id}`, { method: "DELETE" })
                                    await fetchLeaders()
                                }
                            }}
                            className="text-red-400 hover:text-red-300"
                        >
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}
