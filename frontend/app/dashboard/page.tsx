"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { PitchPractice } from "@/components/pitch-practice"
import AddContextButton from "@/components/add-context-button"
import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Sparkles, TrendingUp, Users } from "lucide-react"

export default function Page() {
  const { user, isLoaded } = useUser()
  const [mounted, setMounted] = useState(false)
  const [showPractice, setShowPractice] = useState(false)
  const [contextFiles, setContextFiles] = useState<any[]>([])

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

  return (
    <SidebarProvider>
      <AppSidebar user={userData} />
      <SidebarInset className="bg-[var(--bg-dark-grey)]">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 text-[var(--text-white)]" />
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          {showPractice ? (
            /* AI Pitch Practice Component */
            <PitchPractice 
              uploadedFiles={contextFiles} 
              onBack={() => setShowPractice(false)}
              onDeleteFile={handleDeleteFile}
            />
          ) : (
            /* Dashboard Landing Page */
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
              <div className="max-w-4xl mx-auto text-center space-y-10">
                {/* Animated Gradient Orb - ElevenLabs Style */}
                <div className="relative mx-auto w-80 h-80 mb-4">
                  {/* Outer glow layers */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/40 via-pink-500/40 to-purple-600/40 rounded-full blur-[80px] animate-pulse"></div>
                  <div className="absolute inset-2 bg-gradient-to-br from-orange-400/50 via-pink-400/50 to-purple-500/50 rounded-full blur-[60px] opacity-90 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  
                  {/* Main orb with animated gradient */}
                  <div className="absolute inset-8 rounded-full overflow-hidden">
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 animate-gradient-shift"></div>
                    
                    {/* Flowing overlay effect */}
                    <div className="absolute inset-0 opacity-60">
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-shimmer"></div>
                    </div>
                    
                    {/* Wave patterns */}
                    <div className="absolute inset-0 opacity-40">
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-orange-400/30 via-transparent to-transparent animate-wave-1"></div>
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-pink-400/30 via-transparent to-transparent animate-wave-2"></div>
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-400/30 via-transparent to-transparent animate-wave-3"></div>
                    </div>
                    
                    {/* Inner glow */}
                    <div className="absolute inset-4 bg-gradient-to-br from-orange-300/20 via-pink-300/20 to-purple-300/20 rounded-full blur-xl"></div>
                  </div>
                  
                  {/* Rotating ring effect */}
                  <div className="absolute inset-0 rounded-full animate-spin-slow opacity-30">
                    <div className="absolute top-0 left-1/2 w-2 h-2 -ml-1 bg-white rounded-full blur-sm"></div>
                    <div className="absolute bottom-0 left-1/2 w-2 h-2 -ml-1 bg-pink-300 rounded-full blur-sm"></div>
                  </div>
                </div>

                {/* Main Heading */}
                <div className="space-y-5">
                  <h1 className="text-6xl font-bold text-white tracking-tight leading-tight">
                    Turn Ideas into Winning Pitches
                  </h1>
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                    Collaborate, refine, and present your story with confidence. Pitchex helps you craft and deliver powerful pitches effortlessly.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
                  <Button
                    onClick={() => setShowPractice(true)}
                    size="lg"
                    className="bg-white text-black hover:bg-gray-100 font-semibold px-10 py-7 text-lg rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl w-full sm:w-auto"
                  >
                    Start Pitching
                  </Button>
                  
                  <AddContextButton
                    sessionId={user?.id || "default_session"}
                    onContextAdded={(files) => {
                      console.log("Context files uploaded:", files)
                      setContextFiles(files || [])
                      setShowPractice(true)
                    }}
                    className="w-full sm:w-auto"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
