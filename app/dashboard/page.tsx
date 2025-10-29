"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"

export default function Page() {
  const { user, isLoaded } = useUser()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-dark-grey)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--text-white)]"></div>
      </div>
    )
  }

  const userData = {
    name: user?.fullName || "User",
    email: user?.emailAddresses[0]?.emailAddress || "",
    avatar: user?.imageUrl || "",
  }

  return (
    <SidebarProvider>
      <AppSidebar user={userData} />
      <SidebarInset className="bg-[var(--bg-dark-grey)]">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-[var(--bg-gray)] border-b border-[var(--border-gray)]">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 text-[var(--text-white)]" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-[var(--border-gray)]" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#" className="text-[var(--text-white)] hover:text-[var(--text-white)]/80">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block text-[var(--disable-grey)]" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[var(--text-white)]">Home</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-[var(--bg-gray)] md:min-h-min border border-[var(--border-gray)] p-6">
            <h1 className="text-[var(--text-white)] font-bold mb-4">Welcome to Pitchex</h1>
            <p className="text-[var(--text-white)]/80 mb-6">
              Start creating amazing pitches with our AI-powered tools.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Card 1 */}
              <div className="bg-[var(--bg-dark-grey)] border border-[var(--border-gray)] rounded-lg p-6 hover:border-[var(--text-white)]/20 transition-colors">
                <h3 className="text-[var(--text-white)] font-semibold mb-2">New Session</h3>
                <p className="text-[var(--text-white)]/60 text-sm">
                  Create a new pitch session and start recording your ideas.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-[var(--bg-dark-grey)] border border-[var(--border-gray)] rounded-lg p-6 hover:border-[var(--text-white)]/20 transition-colors">
                <h3 className="text-[var(--text-white)] font-semibold mb-2">Previous Sessions</h3>
                <p className="text-[var(--text-white)]/60 text-sm">
                  Access and review your past pitch sessions.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-[var(--bg-dark-grey)] border border-[var(--border-gray)] rounded-lg p-6 hover:border-[var(--text-white)]/20 transition-colors">
                <h3 className="text-[var(--text-white)] font-semibold mb-2">Analytics</h3>
                <p className="text-[var(--text-white)]/60 text-sm">
                  View insights and performance metrics for your pitches.
                </p>
              </div>
            </div>

            {/* Stats Section */}
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <div className="bg-[var(--bg-dark-grey)] border border-[var(--border-gray)] rounded-lg p-4">
                <div className="text-[var(--disable-grey)] text-sm mb-1">Total Sessions</div>
                <div className="text-[var(--text-white)] text-2xl font-bold">6</div>
              </div>
              
              <div className="bg-[var(--bg-dark-grey)] border border-[var(--border-gray)] rounded-lg p-4">
                <div className="text-[var(--disable-grey)] text-sm mb-1">This Week</div>
                <div className="text-[var(--text-white)] text-2xl font-bold">2</div>
              </div>
              
              <div className="bg-[var(--bg-dark-grey)] border border-[var(--border-gray)] rounded-lg p-4">
                <div className="text-[var(--disable-grey)] text-sm mb-1">Average Score</div>
                <div className="text-[var(--text-white)] text-2xl font-bold">8.5</div>
              </div>
              
              <div className="bg-[var(--bg-dark-grey)] border border-[var(--border-gray)] rounded-lg p-4">
                <div className="text-[var(--disable-grey)] text-sm mb-1">Hours Practiced</div>
                <div className="text-[var(--text-white)] text-2xl font-bold">12</div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
