import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
 "inline-flex items-center justify-center whitespace-nowrap rounded-md text-body font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
 {
 variants: {
 variant: {
 primary:
 "bg-accent text-white hover:bg-accent-hover active:bg-accent-hover",
 secondary:
 "bg-surface-raised text-content-primary border border-line hover:bg-neutral-200 active:bg-neutral-300",
 ghost:
 "text-content-primary hover:bg-surface-raised active:bg-neutral-200",
 destructive:
 "bg-status-error text-white hover:bg-red active:bg-red",
 link:
 "text-accent underline-offset-4 hover:underline p-0 h-auto",
 },
 size: {
 sm: "h-8 px-3 text-body-sm",
 md: "h-9 px-4 text-body",
 lg: "h-10 px-5 text-title",
 icon: "h-9 w-9",
 },
 },
 defaultVariants: {
 variant: "primary",
 size: "md",
 },
 }
)

export interface ButtonProps
 extends React.ButtonHTMLAttributes<HTMLButtonElement>,
 VariantProps<typeof buttonVariants> {
 asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
 ({ className, variant, size, asChild = false, ...props }, ref) => {
 const Comp = asChild ? Slot : "button"
 return (
 <Comp
 className={cn(buttonVariants({ variant, size, className }))}
 ref={ref}
 {...props}
 />
 )
 }
)
Button.displayName = "Button"

export { Button, buttonVariants }
