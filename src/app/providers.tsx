'use client'
import React, {useState} from "react";
import {} from "@tanstack/query-core";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import { UserProvider } from "@/context/UserContext";

export default function Providers({children} : {children: React.ReactNode}) {

    const [queryClient] =  useState(() => new  QueryClient())
    return(
        <QueryClientProvider client={queryClient}>
                <UserProvider>
                    {children}
                </UserProvider>

        </QueryClientProvider>
    )
}