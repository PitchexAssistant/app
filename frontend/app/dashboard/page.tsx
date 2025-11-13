"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { PitchPractice } from "@/components/pitch-practice"
import { useUser, useClerk } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { Users, Settings, LogOut, ChevronDown } from "lucide-react"
import { useSessions } from "@/hooks/use-sessions"
import { Session } from "@/lib/api/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function Page() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showPractice, setShowPractice] = useState(false)
  const [contextFiles, setContextFiles] = useState<any[]>([])
  const { createSession, currentSession, setCurrentSession } = useSessions()

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

  const handleDeleteFile = (index: number) => {
    setContextFiles(prev => {
      const newFiles = [...prev]
      // Revoke the blob URL to free memory
      if (newFiles[index]?.local_url) {
        URL.revokeObjectURL(newFiles[index].local_url!)
      }
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const handleNewSession = () => {
    // Clear current session and show practice mode selector
    setCurrentSession(null)
    setShowPractice(true)
  }

  const handleSelectSession = (session: Session) => {
    // Load the existing session
    setCurrentSession(session)
    setShowPractice(true)
  }

  const handleBackToSessions = () => {
    // Clear current session and return to landing page with session list visible
    setCurrentSession(null);
    setShowPractice(false);
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <SidebarProvider>
      <AppSidebar 
        user={userData} 
        onNewSession={handleNewSession}
        onSelectSession={handleSelectSession}
      />
      <SidebarInset className="bg-[var(--bg-dark-grey)]">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-zinc-800/30 px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 text-[var(--text-white)]" />
          </div>
          
          {/* Profile Section - Top Right with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer focus:outline-none">
                <div className="w-10 h-10 bg-orange-500 rounded-full inline-flex flex-col justify-center items-center">
                  <div className="text-white text-sm font-semibold font-['Uber_Move']">
                    {userData.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-zinc-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-60 bg-[#262626] border border-zinc-700 rounded-lg"
            >
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-full inline-flex flex-col justify-center items-center">
                    <div className="text-white text-sm font-semibold font-['Uber_Move']">
                      {userData.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <div className="text-zinc-100 text-sm font-bold font-['Uber_Move'] truncate">
                      {userData.name}
                    </div>
                    <div className="text-stone-500 text-sm font-medium font-['Uber_Move'] truncate">
                      {userData.email}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Menu Items */}
              <DropdownMenuItem className="px-4 py-2.5 text-zinc-400 hover:bg-zinc-800 cursor-pointer focus:bg-zinc-800 focus:text-zinc-300">
                <Users className="w-4 h-4 mr-3" />
                <span className="text-sm font-medium font-['Uber_Move']">Manage Plans</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="px-4 py-2.5 text-zinc-400 hover:bg-zinc-800 cursor-pointer focus:bg-zinc-800 focus:text-zinc-300">
                <Settings className="w-4 h-4 mr-3" />
                <span className="text-sm font-medium font-['Uber_Move']">Settings</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-zinc-700" />
              
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="px-4 py-2.5 text-zinc-400 hover:bg-zinc-800 cursor-pointer focus:bg-zinc-800 focus:text-zinc-300"
              >
                <LogOut className="w-4 h-4 mr-3" />
                <span className="text-sm font-medium font-['Uber_Move']">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          {showPractice ? (
            /* AI Pitch Practice Component */
            <PitchPractice 
              uploadedFiles={contextFiles} 
              onBack={handleBackToSessions}
              onDeleteFile={handleDeleteFile}
              initialSession={currentSession}
            />
          ) : (
            /* Dashboard Landing Page - Exact Figma Match */
            <div className="flex-1 bg-[#171717] rounded-tl-[40px] border-l border-t border-[#2c2c33] flex flex-col min-h-screen overflow-hidden">
              {/* Main Content - Centered */}
              <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
                {/* Orb - Exact from Figma with gradient overlay */}
                <div 
                  className="relative w-[220px] h-[220px] rounded-full overflow-hidden"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    animation: 'orb-pulse 3s ease-in-out infinite'
                  } as React.CSSProperties}
                >
                  {/* Base gradient image with rotation and reduced opacity */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      animation: 'orb-rotate 20s linear infinite',
                      opacity: 0.4
                    } as React.CSSProperties}
                  >
                    <Image
                      src="https://www.figma.com/api/mcp/asset/54798332-3632-499d-8b6f-e17134f282b1"
                      alt="Gradient orb"
                      width={220}
                      height={220}
                      className="w-full h-full object-cover"
                      priority
                      unoptimized
                    />
                  </div>
                  
                  {/* Animated gradient overlay - matching Figma exactly */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, rgba(255, 107, 0, 0.6) 0%, rgba(236, 72, 153, 0.5) 30%, rgba(168, 85, 247, 0.4) 60%, rgba(59, 130, 246, 0.3) 100%)',
                      backgroundSize: '200% 200%',
                      animation: 'gradient-shift 8s ease infinite',
                      mixBlendMode: 'screen' as 'screen'
                    } as React.CSSProperties}
                  ></div>
                  
                  {/* Outer glow for depth */}
                  <div 
                    className="absolute inset-[-10px] rounded-full"
                    style={{
                      backgroundImage: 'radial-gradient(circle, rgba(255, 107, 0, 0.2) 0%, transparent 70%)',
                      filter: 'blur(20px)',
                      zIndex: -1,
                      pointerEvents: 'none' as 'none'
                    } as React.CSSProperties}
                  ></div>
                </div>

                {/* Text Content - Exact Figma Typography */}
                <div className="max-w-[546px] text-center flex flex-col gap-3">
                  <h1 className="text-[36px] font-bold text-[#f0f0f0] leading-[44px] tracking-[-0.72px]">
                    Turn Ideas into Winning Pitches
                  </h1>
                  <p className="text-[16px] font-medium text-white leading-[24px]">
                    Collaborate, refine, and present your story with confidence. Pitchex helps you craft and deliver powerful pitches effortlessly.
                  </p>
                </div>

                {/* CTA Button - Exact Figma Design */}
                <button
                  onClick={() => setShowPractice(true)}
                  className="w-[260px] h-[44px] bg-[#f0f0f0] text-[#0d0d0f] rounded-[12px] font-bold text-[16px] leading-[24px] hover:bg-white transition-colors border border-[#0d0d0f] flex items-center justify-center"
                >
                  Start Pitching
                </button>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
