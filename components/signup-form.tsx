"use client"

import { useState } from "react"
import { useSignUp } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const { isLoaded, signUp, setActive } = useSignUp()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    setIsLoading(true)
    setError("")

    try {
      const signUpAttempt = await signUp.create({
        emailAddress: email,
        password,
      })

      // Handle email verification if required
      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId })
        router.push("/dashboard")
      } else if (signUpAttempt.status === "missing_requirements") {
        // If email verification is required, handle it
        setError("Please check your email for verification link")
      }
    } catch (err: any) {
      console.error("Sign up error:", err)
      setError(err.errors?.[0]?.message || "Failed to create account")
    } finally {
      setIsLoading(false)
    }
  }

  const signUpWithGoogle = async () => {
    if (!isLoaded) return

    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sign-up/sso-callback",
        redirectUrlComplete: "/dashboard",
      })
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to sign up with Google")
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Enter your email below to create your account
        </p>
      </div>
      <div className="grid gap-6">
        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          style={{ fontFamily: "var(--font-uber-move), sans-serif" }}
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
        <Button
          variant="outline"
          className="w-full"
          type="button"
          onClick={signUpWithGoogle}
          style={{ fontFamily: "var(--font-uber-move), sans-serif" }}
          disabled={isLoading}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="mr-2 h-5 w-5"
          >
            <g>
              <path
                fill="#FFF"
                d="M43.611 20.083H42V20H24v8h11.303C33.97 32.084 29.36 35 24 35c-6.075 0-11-4.925-11-11s4.925-11 11-11c2.507 0 4.81.857 6.646 2.278l6.366-6.366C33.527 6.163 28.97 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20c11.045 0 19.824-8.955 19.824-20 0-1.341-.138-2.651-.213-3.917z"
              />
              <path
                fill="#FFF"
                d="M6.306 14.691l6.571 4.819C14.655 16.1 19.01 13 24 13c2.507 0 4.81.857 6.646 2.278l6.366-6.366C33.527 6.163 28.97 4 24 4c-7.732 0-14.41 4.388-17.694 10.691z"
              />
              <path
                fill="#FFF"
                d="M24 44c5.311 0 9.799-1.757 13.066-4.77l-6.047-4.946C29.36 35 24 35 18.697 32.084l-6.391 4.93C9.59 39.612 16.268 44 24 44z"
              />
              <path
                fill="#FFF"
                d="M43.611 20.083H42V20H24v8h11.303c-1.94 4.084-6.55 7-11.303 7-2.507 0-4.81-.857-6.646-2.278l-6.366 6.366C14.473 41.837 19.03 44 24 44c7.732 0 14.41-4.388 17.694-10.691z"
              />
              <path fill="none" d="M0 0h48v48H0z" />
            </g>
          </svg>
          Sign up with Google
        </Button>
      </div>
      <div className="text-center text-sm">
        Already have an account?{" "}
        <a
          href="/sign-in"
          className="underline underline-offset-4"
          style={{ color: "var(--orange-accent)" }}
        >
          Sign in
        </a>
      </div>
    </form>
  )
}
