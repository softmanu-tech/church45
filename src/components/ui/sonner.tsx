"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import React from "react"

type ToastVariant = "default" | "success" | "warning" | "error" | "info"
type ExtendedToasterProps = ToasterProps & {
    title?: string
    description?: string
    variant?: ToastVariant
}
const variantStyles: Record<ToastVariant, React.CSSProperties> = {
    default: {
        backgroundColor: "var(--popover)",
        color: "var(--popover-foreground)",
        border: "1px solid var(--border)",
    },
    success: {
        backgroundColor: "var(--success-bg)",
        color: "var(--success-fg)",
        border: "1px solid var(--success-border)",
    },
    warning: {
        backgroundColor: "var(--warning-bg)",
        color: "var(--warning-fg)",
        border: "1px solid var(--warning-border)",
    },
    error: {
        backgroundColor: "var(--error-bg)",
        color: "var(--error-fg)",
        border: "1px solid var(--error-border)",
    },
    info: {
        backgroundColor: "var(--info-bg)",
        color: "var(--info-fg)",
        border: "1px solid var(--info-border)",
    },
}


const Toaster = ({ variant = "default", ...props }: ExtendedToasterProps) => {
    const { theme = "system" } = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            toastOptions={{
                style: variantStyles[variant],
                classNames: {
                    toast: `toast-variant-${variant}`,
                },
                ...(props.title && { title: props.title }),
                ...(props.description && { description: props.description }),
            }}
            {...props}
        />
    )
}

export { Toaster }