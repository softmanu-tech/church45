// src/app/(dashboard)/leader/components/MembersTable.tsx
"use client"
import { useState } from "react"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface Member {
    _id: string
    name: string
    email: string
    phone: string
}

interface MembersTableProps {
    members: Member[]
    groupId: string
    onMemberAdded: () => void
}

export function MembersTable({ members, groupId, onMemberAdded }: MembersTableProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newMember, setNewMember] = useState({
        name: "",
        email: "",
        phone: ""
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleAddMember = async () => {
        try {
            setIsSubmitting(true)

            const response = await fetch("/api/members", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...newMember,
                    groupId,
                    role: "member"
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to add member")
            }

            // Reset form and refresh data
            setNewMember({ name: "", email: "", phone: "" })
            setIsDialogOpen(false)
            onMemberAdded()

        } catch (error) {
            console.error("Error adding member:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Add Member
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Name</label>
                            <Input
                                value={newMember.name}
                                onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                                placeholder="Member name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                value={newMember.email}
                                onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                                placeholder="member@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Phone</label>
                            <Input
                                type="tel"
                                value={newMember.phone}
                                onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                                placeholder="Phone number"
                            />
                        </div>
                        <Button
                            onClick={handleAddMember}
                            disabled={isSubmitting || !newMember.name}
                            className="w-full"
                        >
                            {isSubmitting ? "Adding..." : "Add Member"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.length > 0 ? (
                            members.map(member => (
                                <TableRow key={member._id}>
                                    <TableCell>{member.name}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell>{member.phone}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-4">
                                    No members in this group yet
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}