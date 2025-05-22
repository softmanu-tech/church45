"use client"

import type React from "react"

import { useState } from "react"
import {toast} from 'react-toastify'

interface CreateMemberFormProps {
  groupId: string
  onMemberCreated: () => void
}

export function CreateMemberForm({ groupId, onMemberCreated }: CreateMemberFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [department, setDepartment] = useState("")
  const [location, setLocation] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, phone, department, location, groupId }),
      })

      if (!res.ok) {
        throw new Error("Failed to create member")
      }

      setName("")
      setEmail("")
      setPhone("")
      setDepartment("")
      setLocation("")
      onMemberCreated()
      toast.success("Member created successfully!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create member');
      console.error("Error creating member:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      
        
        
      
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Phone</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Department</label>
        <input
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button
            type="button"
            onClick={() => onMemberCreated()} // Close without submitting
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            disabled={loading}
          >
            Cancel
          </button>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" disabled={loading}>
          {loading ? "Creating..." : "Create Member"}
        </button>
      </div>
    </form>
  )
}
