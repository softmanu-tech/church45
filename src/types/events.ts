// src/types/event.ts
export interface Event {
    _id: string
    title: string
    date: string  // ISO string format
    description: string
    groupId: string
    createdBy: string
    group?: {
        _id: string
        name: string
    }
}