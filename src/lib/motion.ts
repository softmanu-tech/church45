// lib/motion.ts
import { Variants } from "framer-motion";

export const fadeIn = (
    direction: "up" | "down" | "left" | "right",
    type: string,
    delay: number,
    duration: number
): Variants => ({
    hidden: {
        opacity: 0,
        y: direction === "up" ? 20 : direction === "down" ? -20 : 0,
        x: direction === "left" ? 20 : direction === "right" ? -20 : 0,
    },
    show: {
        opacity: 1,
        y: 0,
        x: 0,
        transition: {
            type,
            delay,
            duration,
            ease: "easeOut",
        },
    },
});

export const staggerContainer = (
    delayChildren: number,
    staggerChildren: number
): Variants => ({
    hidden: {},
    show: {
        transition: {
            delayChildren,
            staggerChildren,
        },
    },
});