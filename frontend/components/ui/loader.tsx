import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "default" | "lg" | "xl"
}

export function Loader({ size = "default", className, ...props }: LoaderProps) {
    const sizeClasses = {
        sm: "h-4 w-4",
        default: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
    }

    return (
        <div className={cn("flex items-center justify-center", className)} {...props}>
            <Loader2 className={cn("animate-spin text-[var(--color-primary)]", sizeClasses[size])} />
        </div>
    )
}
