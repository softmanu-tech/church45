import type { Metadata } from "next";
import { Rowdies, Cinzel } from "next/font/google";
import "./globals.css";
import Providers from "@/app/providers";


import { initBishop } from '@/lib/initBishop'
import React from "react";

// Load Rowdies and Cinzel fonts
const rowdies = Rowdies({
    variable: "--font-rowdies",
    subsets: ["latin"],
    weight: ["300", "400", "700"], // Adjust weights based on your design needs
});

const cinzel = Cinzel({
    variable: "--font-cinzel",
    subsets: ["latin"],
    weight: ["400", "700", "900"], // Adjust weights as needed
});

export const metadata: Metadata = {
    title: "G-45",
    description: "prepare the way",
};

export default async function RootLayout({children,}: Readonly<{ children: React.ReactNode;}>) {

    await initBishop()


    return (
        <html lang="en">
        <body
            className={`${rowdies.variable} ${cinzel.variable} antialiased`}
        >
        <Providers>
            {children}
        </Providers>
        </body>
        </html>
    );
}
