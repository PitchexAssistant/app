"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { PitchPractice } from "@/components/pitch-practice"
import { UploadModal } from "@/components/upload-modal"
import { ModeSelectionModal } from "@/components/mode-selection-modal"
import { RecordedSession } from "@/components/recorded-session"
import { ResultsPage } from "@/components/results-page"
import { SettingsModal } from "@/components/settings-modal"
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
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { ChatTranscriptView } from "@/components/chat-transcript-view"

export default function Page() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [showPractice, setShowPractice] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showModeSelection, setShowModeSelection] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [contextFiles, setContextFiles] = useState<any[]>([])
  const [selectedMode, setSelectedMode] = useState<'live' | 'recorded' | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [resultsData, setResultsData] = useState<any>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [activeView, setActiveView] = useState<'dashboard' | 'practice' | 'transcript' | 'results'>('dashboard')
  const [selectedSessionForView, setSelectedSessionForView] = useState<Session | null>(null)
  const { createSession, currentSession, setCurrentSession, completeSession } = useSessions()

  useEffect(() => {
    setMounted(true)

    // Check for newSession query parameter
    const newSession = searchParams?.get('newSession')
    if (newSession === 'true') {
      // Clear the query parameter
      router.replace('/dashboard')
      // Show upload modal to start new session
      setShowUploadModal(true)
    }
  }, [searchParams, router])

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
    // Clear current session and show upload modal
    setCurrentSession(null)
    setShowUploadModal(true)
  }

  const handleSelectSession = (session: Session) => {
    console.log('[Dashboard] Session selected:', session.id, 'status:', session.status, 'mode:', session.mode)

    // Route based on session status and mode
    if (session.status === 'completed') {
      // For completed recorded sessions with analysis, show ResultsPage
      if (session.mode === 'recorded' && session.analysis) {
        console.log('[Dashboard] Routing to results page for recorded session')
        setResultsData({
          audioBlob: null,
          transcript: session.transcript || '',
          analysis: session.analysis
        })
        setActiveView('results')
        setShowResults(true)
      } else {
        // Show chat transcript for completed live sessions
        console.log('[Dashboard] Routing to transcript for live session')
        setSelectedSessionForView(session)
        setActiveView('transcript')
      }
    } else {
      // For active sessions, check mode
      if (session.mode === 'recorded') {
        // Don't resume recording - show message or redirect to results if analysis exists
        if (session.analysis) {
          setResultsData({
            audioBlob: null,
            transcript: session.transcript || '',
            analysis: session.analysis
          })
          setActiveView('results')
          setShowResults(true)
        } else {
          // Session was abandoned before processing - just show dashboard
          console.log('[Dashboard] Recorded session has no analysis, showing dashboard')
          setActiveView('dashboard')
        }
      } else {
        // Show live UI for active live sessions (resume)
        setCurrentSession(session)
        setSelectedMode('live')
        setActiveView('practice')
        setShowPractice(true)
      }
    }
  }

  const handleBackToSessions = () => {
    // Clear current session and return to landing page with session list visible
    setCurrentSession(null)
    setSelectedSessionForView(null)
    setActiveView('dashboard')
    setShowPractice(false)
  }

  // Handle session completion - navigate immediately to transcript view
  const handleSessionComplete = (completedSession: Session) => {
    console.log('[Dashboard] Session completed:', completedSession.id, 'status:', completedSession.status)
    setCurrentSession(null)
    setShowPractice(false)
    setSelectedSessionForView(completedSession)
    setActiveView('transcript')
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const handleStartPitching = () => {
    setShowUploadModal(true)
  }

  const handleUploadComplete = async (files: File[]) => {
    setUploadedFiles(files)
    setShowUploadModal(false)

    if (!files || files.length === 0) {
      // Skip directly to mode selection if no files uploaded
      setShowModeSelection(true)
      return
    }

    // Show mode selection modal after file upload
    setShowModeSelection(true)
  }

  const handleModeSelection = async (mode: 'live' | 'recorded') => {
    setSelectedMode(mode)
    setShowModeSelection(false)

    // Generate session title
    const sessionTitle = `${mode === 'live' ? 'Live' : 'Recorded'} Session - ${new Date().toLocaleString()}`

    try {
      // Create a new session first
      const newSession = await createSession(sessionTitle, mode)

      if (!newSession) {
        throw new Error("Failed to create session")
      }

      // Upload each file to the backend using the session ID
      const uploadedFileData = []

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i]
        const formData = new FormData()
        formData.append("file", file)
        formData.append("session_id", newSession.id)
        formData.append("file_index", i.toString())

        const response = await fetch("http://localhost:8000/api/v1/documents/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const data = await response.json()

        if (data.success) {
          uploadedFileData.push({
            filename: data.data.filename,
            file_id: data.data.file_id,
            file_index: data.data.file_index,
            text_length: data.data.text_length,
            local_url: URL.createObjectURL(file),
            file: file,
          })
        }
      }

      // Set the processed files
      setContextFiles(uploadedFileData)

      // Show the appropriate practice component based on mode
      setShowPractice(true)

    } catch (error) {
      console.error("Error uploading files:", error)
      alert("Failed to upload files. Please try again.")
      setShowModeSelection(true) // Show mode selection again on error
    }
  }

  const handleEndRecordedSession = () => {
    setShowPractice(false)
    setSelectedMode(null)
    setContextFiles([])
    setUploadedFiles([])
    setShowResults(false)
    setResultsData(null)
  }

  const handleShowResults = (audioBlob: Blob, transcript: string, analysis: any) => {
    setResultsData({
      audioBlob,
      transcript,
      analysis
    })
    setShowResults(true)
    setActiveView('results')  // Navigate to results view
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
                <div className="w-10 h-10 bg-orange-500 rounded-full inline-flex flex-col justify-center items-center overflow-hidden">
                  {userData.avatar ? (
                    <img src={userData.avatar} alt={userData.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-white text-sm font-semibold font-['Uber_Move']">
                      {userData.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </div>
                  )}
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
                  <div className="w-10 h-10 bg-orange-500 rounded-full inline-flex flex-col justify-center items-center overflow-hidden">
                    {userData.avatar ? (
                      <img src={userData.avatar} alt={userData.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-white text-sm font-semibold font-['Uber_Move']">
                        {userData.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </div>
                    )}
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

              <DropdownMenuItem
                onClick={() => setShowSettings(true)}
                className="px-4 py-2.5 text-zinc-400 hover:bg-zinc-800 cursor-pointer focus:bg-zinc-800 focus:text-zinc-300"
              >
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
          {/* View Routing - Only ONE view at a time */}
          {activeView === 'transcript' && selectedSessionForView ? (
            /* Chat Transcript View for Completed Sessions */
            <ChatTranscriptView
              sessionId={selectedSessionForView.id}
              chatHistory={selectedSessionForView.chat_history || []}
              metadata={{
                title: selectedSessionForView.title,
                mode: selectedSessionForView.mode,
                created_at: selectedSessionForView.created_at,
                completed_at: selectedSessionForView.completed_at
              }}
              userAvatar={userData.avatar}
              onBack={handleBackToSessions}
              onExport={() => {
                console.log('Export session:', selectedSessionForView.id)
              }}
              onShare={() => {
                console.log('Share session:', selectedSessionForView.id)
              }}
              onViewAnalysis={() => {
                if (selectedSessionForView.analysis) {
                  setResultsData({
                    audioBlob: null,
                    transcript: selectedSessionForView.transcript || '',
                    analysis: selectedSessionForView.analysis
                  })
                  setActiveView('results')
                  setShowResults(true)
                }
              }}
            />
          ) : activeView === 'results' && showResults && resultsData ? (
            /* Results Page */
            <ResultsPage
              transcript={resultsData.transcript}
              analysis={resultsData.analysis}
            />
          ) : (activeView === 'practice' || showPractice) ? (
            /* Practice Views */
            selectedMode === 'recorded' ? (
              <RecordedSession
                uploadedFiles={contextFiles}
                onEndSession={handleEndRecordedSession}
                onShowResults={handleShowResults}
                sessionId={currentSession?.id || ''}
                userId={user?.id || ''}
              />
            ) : (
              <PitchPractice
                uploadedFiles={contextFiles}
                onBack={handleBackToSessions}
                onComplete={handleSessionComplete}
                onDeleteFile={handleDeleteFile}
                initialSession={currentSession}
              />
            )
          ) : (
            /* Dashboard Landing Page - Default View */
            <div className="flex-1 bg-[#171717] rounded-tl-[40px] border-l border-t border-[#2c2c33] flex flex-col min-h-screen overflow-x-hidden overflow-y-hidden">
              <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 gap-6 sm:gap-8">
                <div
                  className="relative w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] lg:w-[220px] lg:h-[220px] rounded-full overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <div
                    className="absolute inset-0"
                    style={{ animation: 'orb-rotate 20s linear infinite', opacity: 0.7 }}
                  >
                    <Image
                      src="/mas-circle.png"
                      alt="Gradient orb"
                      width={220}
                      height={220}
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, rgba(255, 107, 0, 0.6) 0%, rgba(236, 72, 153, 0.5) 30%, rgba(168, 85, 247, 0.4) 60%, rgba(59, 130, 246, 0.3) 100%)',
                      backgroundSize: '200% 200%',
                      animation: 'gradient-shift 8s ease infinite',
                      mixBlendMode: 'screen' as 'screen'
                    }}
                  />
                  <div
                    className="absolute inset-[-10px] rounded-full"
                    style={{
                      backgroundImage: 'radial-gradient(circle, rgba(255, 107, 0, 0.2) 0%, transparent 70%)',
                      filter: 'blur(20px)',
                      zIndex: -1,
                      pointerEvents: 'none' as 'none'
                    }}
                  />
                </div>
                <div className="max-w-[90%] sm:max-w-[546px] text-center flex flex-col gap-2 sm:gap-3">
                  <h1 className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-[#f0f0f0] leading-tight lg:leading-[44px] tracking-tight lg:tracking-[-0.72px]">
                    Turn Ideas into Winning Pitches
                  </h1>
                  <p className="text-sm sm:text-base lg:text-[16px] font-medium text-white leading-relaxed lg:leading-[24px]">
                    Collaborate, refine, and present your story with confidence. Pitchex helps you craft and deliver powerful pitches effortlessly.
                  </p>
                </div>
                <button
                  onClick={handleStartPitching}
                  className="w-full max-w-[260px] sm:w-[260px] h-[44px] bg-[#f0f0f0] text-[#0d0d0f] rounded-[12px] font-bold text-sm sm:text-base leading-tight hover:bg-white transition-colors border border-[#0d0d0f] flex items-center justify-center"
                >
                  Start Pitching
                </button>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onNext={handleUploadComplete}
        />
      )}

      {/* Mode Selection Modal */}
      {showModeSelection && (
        <ModeSelectionModal
          onClose={() => setShowModeSelection(false)}
          onContinue={handleModeSelection}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </SidebarProvider>
  )
}
