"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

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
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 text-[var(--text-white)]" />
          </div>
        </header>
        
        <div className="flex flex-1 flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
          <div className="flex flex-col items-center justify-center max-w-3xl w-full gap-8">
            {/* Circular Image */}
            <Image 
              src="/mas-circle.png"
              width={400} 
              height={400} 
              sizes="100vw" 
              alt="Pitchex" 
              className="w-72 h-72 md:w-96 md:h-96"
              priority
            />
            
            {/* Main Heading */}
            <h1 className="text-2xl md:text-3xl font-normal text-center bg-gradient-to-r from-white to-[#999] bg-clip-text text-transparent">
              Turn Ideas into Winning Pitches
            </h1>
            
            {/* Description Text */}
            <p className="text-[var(--text-white)] text-base md:text-lg text-center max-w-2xl px-4">
              Collaborate, refine, and present your story with confidence. Pitchex helps you craft and deliver powerful pitches effortlessly.
            </p>
            
            {/* Start Pitching Button */}
            <Button 
              className="w-64 h-11 px-4 py-3 font-['Uber_Move'] bg-white rounded-xl shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] border border-neutral-950 inline-flex justify-center cursor-pointer items-center gap-2 overflow-hidden text-neutral-950 text-base font-bold hover:bg-zinc-200"
            >
              Start Pitching
            </Button>
            
            {/* Add Context Button */}
            <ShimmerButton icon={<Image src="/ai-icon-gradient.svg" width={24} height={24} alt="icon" />}>
              Add Context for our model
            </ShimmerButton>
                      
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
