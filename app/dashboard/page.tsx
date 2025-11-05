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
          <div className="flex flex-col items-center justify-center max-w-2xl w-full gap-4 sm:gap-5 px-4">
            {/* Circular Image - Responsive with max 300px */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 max-w-[300px] max-h-[300px]">
              <Image 
                src="/mas-circle.png"
                fill
                sizes="(max-width: 640px) 160px, (max-width: 768px) 180px, (max-width: 1024px) 200px, 240px"
                alt="Pitchex" 
                className="object-contain"
                priority
              />
            </div>
            
            {/* Main Heading - Using CSS variables for font sizes */}
            <h1 
              className="font-normal text-center bg-gradient-to-r from-white to-[#999] bg-clip-text text-transparent px-4"
              style={{ 
                fontSize: 'clamp(var(--font-size-h4), 5vw, var(--font-size-h1))'
              }}
            >
              Turn Ideas into Winning Pitches
            </h1>
            
            {/* Description Text - Using CSS variables */}
            <p 
              className="text-[var(--text-white)] text-center max-w-xl lg:max-w-2xl px-4 sm:px-6"
              style={{
                fontSize: 'clamp(var(--font-size-caption), 2vw, var(--font-size-body))'
              }}
            >
              Collaborate, refine, and present your story with confidence. Pitchex helps you craft and deliver powerful pitches effortlessly.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-3 mt-2 sm:mt-4 w-full max-w-xs sm:max-w-sm">
              {/* Start Pitching Button - Using button font size variable */}
              <Button 
                className="w-full sm:w-64 h-10 sm:h-10 px-4 py-3 font-['Uber_Move'] bg-white rounded-lg shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] border border-neutral-950 inline-flex justify-center cursor-pointer items-center gap-2 overflow-hidden text-neutral-950 font-bold hover:bg-zinc-200 transition-colors"
                style={{
                  fontSize: 'var(--font-size-button)'
                }}
              >
                Start Pitching
              </Button>
              
              {/* Add Context Button - Using button font size variable */}
              <div className="w-full sm:w-64">
                <ShimmerButton 
                  icon={<Image src="/ai-icon-gradient.svg" width={20} height={20} alt="icon" className="sm:w-6 sm:h-6" />}
                  className="w-full"
                  style={{
                    fontSize: 'var(--font-size-button)'
                  }}
                >
                  Add Context for our model
                </ShimmerButton>
              </div>
            </div>
                      
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
