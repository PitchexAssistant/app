import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none bg-transparent",
            headerTitle: "text-2xl font-bold",
            headerSubtitle: "text-muted-foreground text-sm",
            socialButtonsBlockButton: "font-[var(--font-uber-move),sans-serif]",
            formButtonPrimary: "font-[var(--font-uber-move),sans-serif] bg-primary hover:bg-primary/90",
            footerActionLink: "text-[var(--orange-accent)] hover:text-[var(--orange-accent)]/90",
          },
        }}
      />
    </div>
  )
}
