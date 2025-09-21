import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email below to login to your account
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
              style={{ color: "var(--orange-accent)" }}
            >
              Forgot your password?
            </a>
          </div>
          <Input id="password" type="password" required />
        </div>
        <Button type="submit" className="w-full"
        style={{ fontFamily: "var(--font-uber-move), sans-serif" }}
        >
          Login
        </Button>
        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Or continue with
          </span>
        </div>
        <a
          href="/api/auth/signin/google"
          className="w-full"
          style={{ textDecoration: "none" }}
        >
          <Button variant="outline" className="w-full" type="button"
        style={{ fontFamily: "var(--font-uber-move), sans-serif" }}
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
            Login with Google
          </Button>
        </a>
      </div>
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <a href="#" className="underline underline-offset-4"
            style={{ color: "var(--orange-accent)" }} 
            >
          
          Sign up
        </a>
      </div>
    </form>
  )
}
