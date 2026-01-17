"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface InputDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    defaultValue?: string
    placeholder?: string
    onConfirm: (value: string) => void
    confirmLabel?: string
    cancelLabel?: string
}

export function InputDialog({
    open,
    onOpenChange,
    title,
    description,
    defaultValue = "",
    placeholder,
    onConfirm,
    confirmLabel = "Save",
    cancelLabel = "Cancel",
}: InputDialogProps) {
    const [value, setValue] = React.useState(defaultValue)

    // Reset value when dialog opens with new defaultValue
    React.useEffect(() => {
        if (open) {
            setValue(defaultValue)
        }
    }, [open, defaultValue])

    const handleConfirm = () => {
        if (value.trim()) {
            onConfirm(value.trim())
            onOpenChange(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault()
            handleConfirm()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="bg-surface-1 border-border-primary sm:max-w-md"
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle className="text-text-primary">{title}</DialogTitle>
                    {description && (
                        <DialogDescription className="text-text-secondary">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>
                <div className="py-2">
                    <Input
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="bg-surface-2 border-border-primary text-text-primary placeholder:text-text-tertiary focus:border-accent-lime"
                        autoFocus
                    />
                </div>
                <DialogFooter>
                    <Button variant="nav" onClick={() => onOpenChange(false)}>
                        {cancelLabel}
                    </Button>
                    <Button variant="default" onClick={handleConfirm} disabled={!value.trim()}>
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
