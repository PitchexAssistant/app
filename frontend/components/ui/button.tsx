import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        // Primary CTA button (accent-lime background)
        default:
          "bg-accent-lime font-medium text-surface-0 hover:bg-accent-lime/80",
        // Active state button (white background)
        active:
          "bg-text-primary font-medium text-surface-0 hover:bg-text-primary/80",
        // Nav button (surface-2 background)
        nav:
          "bg-surface-2 text-text-primary hover:bg-surface-3",
        // Ghost button (transparent, shows bg on hover)
        ghost:
          "bg-transparent text-text-primary hover:bg-surface-2",
        // Secondary button
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Outline button
        outline:
          "border border-text-primary bg-transparent text-text-primary hover:bg-text-primary hover:text-surface-0",
        // Destructive button
        destructive:
          "bg-destructive/20 text-destructive hover:bg-destructive/15",
        // Mic idle state
        mic:
          "bg-surface-2 border-2 border-surface-3 text-text-primary hover:bg-surface-3",
        // Mic recording state (destructive-like)
        micRecording:
          "bg-red border-2 border-red text-text-primary hover:bg-red/80",
        // Link style
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-3",
        sm: "h-9 px-3 py-2",
        lg: "h-12 px-6 py-4",
        icon: "size-11 p-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
