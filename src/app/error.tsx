'use client'

import { useRouter } from "next/navigation";
import { startTransition } from "react";

export default function ErrorBoundary({ 
    error,
    reset,

}: { error: Error;
    reset: () => void;
 }) {
    const router = useRouter()
    const reload = () => {
        startTransition(() => {
            router.refresh();
            reset();
        })
    }
    return (
        <div className="flex h-screen items-center justify-center">
            <h1 className="text-6xl font-bold">{error.message}</h1>
            <button onClick={reload } className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Try again</button>
        </div>
    )
}