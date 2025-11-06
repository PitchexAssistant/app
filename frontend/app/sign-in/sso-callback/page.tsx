"use client"

import { useEffect } from "react"
import { useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk()
  const router = useRouter()

  useEffect(() => {
    const handle = async () => {
      try {
        await handleRedirectCallback()
        router.push("/dashboard")
      } catch (error) {
        console.error("SSO callback error:", error)
        router.push("/sign-in")
      }
    }
    handle()
  }, [handleRedirectCallback, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
