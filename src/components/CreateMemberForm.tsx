"use client"

import React, { useEffect, useState } from "react"
import { toast } from "react-toastify"

interface Group {
    _id: string; // Unique identifier for the group
    name: string; // Name of the group
}

interface CreateMemberFormProps {
    groupId: string; // The ID of the group to which the member will be added
}

export function CreateMemberForm({  }: CreateMemberFormProps) {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [department, setDepartment] = useState("")
    const [location, setLocation] = useState("")
    const [role, setRole] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [groups, setGroups] = useState<Group[]>([]) // State for groups
    const [selectedGroup, setSelectedGroup] = useState<string>("") // State for selected group

    // Fetch existing groups from the database
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await fetch("/api/bishop/groups") // Update the endpoint to the correct one
                if (!response.ok) {
                    throw new Error("Failed to fetch groups")
                }
                const data = await response.json()
                console.log(data) // Log the fetched data
                if (data.success) {
                    setGroups(data.groups) // Assuming the response contains a 'groups' array
                } else {
                    throw new Error(data.error || "Failed to fetch groups")
                }
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to fetch groups")
                console.error("Error fetching groups:", error)
            }
        }

        fetchGroups()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch("/api/members", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    department,
                    location,
                    groupId: selectedGroup, // Use the selected group
                    role,
                    password,
                }),
            })

            if (!res.ok) {
                throw new Error("Failed to create member")
            }

            // Reset form fields
            setName("")
            setEmail("")
            setPhone("")
            setDepartment("")
            setLocation("")
            setRole("")
            setPassword("")
            setSelectedGroup("") // Reset selected group

            toast.success("Member created successfully!")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create member');
            console.error("Error creating member:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4 bg-blue-500 shadow rounded">
            {/* Other form fields */}
            <div>
                <label className="block text-sm font-semibold mb-1">Select Group</label>
                <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loading}
                >
                    <option value="">Select a group</option>
                    {groups.map((group: Group) => (
                        <option key={group._id} value={group._id}>
                            {group.name}
                        </option>
                    ))}
                </select>
            </div>
            {/* Submit button and other fields */}
        </form>
    )
}
