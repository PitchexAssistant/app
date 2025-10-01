import { UserButton, SignOutButton } from '@clerk/nextjs'
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const user = await currentUser()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">
            Welcome to Dashboard
          </h1>
          <UserButton showName />
        </div>

        <div className="bg-card p-8 rounded-lg border">
          <h2 className="text-2xl font-semibold mb-4">
            Hello, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
          </h2>
          <p className="text-muted-foreground mb-6">
            You have successfully logged in to your account.
          </p>

          <SignOutButton>
            <button
              className="px-6 py-3 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
              style={{ fontFamily: "var(--font-uber-move), sans-serif" }}
            >
              Logout
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  )
}
