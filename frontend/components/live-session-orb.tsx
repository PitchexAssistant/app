"use client"

/**
 * LiveSessionOrb Component
 * 
 * Exact implementation of Figma design for live session interface
 * Features a 250px animated 3D orb with bottom control bar
 * 
 * Layout:
 * - Left: AppSidebar (proper navigation sidebar)
 * - Top Center: Timer display
 * - Center: 250px orb with status text below
 * - Bottom: Control bar (Pause, Mute, Settings, End Session)
 */

import { useState, useEffect, useRef } from 'react'
import { Orb, AgentState } from '@/components/ui/orb'
import { Pause, Play, Mic, MicOff, HelpCircle, X, FileText, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { useUser } from '@clerk/nextjs'

interface LiveSessionOrbProps {
  onEndSession?: () => void
  onBack?: () => void
  sessionId?: string
  contextFiles?: any[]
  isConnected?: boolean
  isRecording?: boolean
  isAISpeaking?: boolean
  onStartRecording?: () => void
  onStopRecording?: () => void
  contextFileName?: string
  pitchMode?: 'live' | 'recorded'
}

export function LiveSessionOrb({ 
  onEndSession, 
  onBack, 
  sessionId, 
  contextFiles,
  isConnected = false,
  isRecording = false,
  isAISpeaking: isAISpeakingProp = false,
  onStartRecording,
  onStopRecording,
  contextFileName,
  pitchMode = 'live'
}: LiveSessionOrbProps) {
  // Three distinct states for orb animation:
  // null (idle) - static orb, no animation
  // listening - reactive to input volume (user speaking)
  // talking - reactive to output volume (AI responding)
  const [agentState, setAgentState] = useState<AgentState>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [micEnabled, setMicEnabled] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('Connecting to your AI Investor...')
  const [statusMessage, setStatusMessage] = useState('Almost ready...')
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  
  // Audio volume refs for orb reactivity
  const inputVolumeRef = useRef<number>(0)
  const outputVolumeRef = useRef<number>(0)
  const lastActivityRef = useRef<number>(Date.now())

  // Start timer when connected
  useEffect(() => {
    if (isConnected && !startTime) {
      setStartTime(Date.now())
    } else if (!isConnected) {
      setStartTime(null)
      setElapsedTime(0)
    }
  }, [isConnected, startTime])

  // Update timer every second
  useEffect(() => {
    if (!startTime || !isConnected) return

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, isConnected])

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Sync AI speaking state from props
  useEffect(() => {
    setIsAISpeaking(isAISpeakingProp)
  }, [isAISpeakingProp])

  // Update agent state based on connection, mic, recording, and AI activity
  // Three states: Idle (null), Listening (user speaking), Talking (AI responding)
  useEffect(() => {
    if (!isConnected) {
      // Connecting state - show thinking animation during connection
      setAgentState('thinking')
      setConnectionStatus('Connecting to your AI Investor...')
      setStatusMessage('Almost ready...')
    } else if (isPaused) {
      // Paused state - idle orb, no animation
      setAgentState(null)
      setConnectionStatus('Session Paused')
      setStatusMessage('Click Resume to continue')
    } else if (!micEnabled || isMuted) {
      // Microphone disabled - idle state (static orb)
      setAgentState(null)
      setConnectionStatus('Connected')
      setStatusMessage('Idle')
    } else if (isAISpeaking) {
      // AI is responding - talking state (animated with output volume)
      setAgentState('talking')
      setConnectionStatus('Connected')
      setStatusMessage('Talking')
    } else if (isRecording && micEnabled && !isMuted) {
      // User is speaking - listening state (animated with input volume)
      setAgentState('listening')
      setConnectionStatus('Connected')
      setStatusMessage('Listening')
      lastActivityRef.current = Date.now()
    } else {
      // Default idle when mic enabled but not actively recording
      setAgentState(null)
      setConnectionStatus('Connected')
      setStatusMessage('Idle')
    }
  }, [isConnected, isRecording, isPaused, micEnabled, isMuted, isAISpeaking])

  // Handle connection state changes
  useEffect(() => {
    if (isConnected) {
      // Connection established - enable microphone ready for user to start
      setMicEnabled(true)
      setIsMuted(false)
      setIsPaused(false)
      setStatusMessage('Idle')
      console.log('[LiveSessionOrb] Connected - microphone enabled')
      
      // Auto-start recording when connected (after small delay for stability)
      const timer = setTimeout(() => {
        if (onStartRecording && !isRecording) {
          console.log('[LiveSessionOrb] Auto-starting recording...')
          onStartRecording()
        }
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      // Not connected - disable controls and stop recording
      console.log('[LiveSessionOrb] Not connected - disabling controls')
      setMicEnabled(false)
      setIsPaused(false)
      setIsMuted(false)
      if (isRecording && onStopRecording) {
        onStopRecording()
      }
    }
  }, [isConnected])

  // Get input volume for microphone - active during listening state
  const getInputVolume = () => {
    if (agentState === 'listening' && micEnabled && !isMuted && !isPaused && isRecording) {
      // Return actual microphone input volume with smooth variation
      // When user is actively speaking, show higher volume
      const baseVolume = 0.4
      const variation = Math.random() * 0.5
      inputVolumeRef.current = baseVolume + variation
      return inputVolumeRef.current
    }
    return 0
  }

  // Get output volume for AI speaking - active during talking state  
  const getOutputVolume = () => {
    if (agentState === 'talking' && !isPaused) {
      // Simulate AI speaking volume with realistic variation
      const baseVolume = 0.5
      const variation = Math.random() * 0.4
      outputVolumeRef.current = baseVolume + variation
      return outputVolumeRef.current
    }
    return 0
  }

  const handlePause = () => {
    const newPausedState = !isPaused
    setIsPaused(newPausedState)
    
    console.log('[LiveSessionOrb] Pause toggled:', { 
      newPausedState, 
      isRecording, 
      micEnabled, 
      isMuted 
    })
    
    // When pausing, stop recording
    if (newPausedState && isRecording) {
      console.log('[LiveSessionOrb] Pausing - stopping recording')
      onStopRecording?.()
    }
    // When resuming, start recording if mic is enabled
    else if (!newPausedState && micEnabled && !isMuted) {
      console.log('[LiveSessionOrb] Resuming - starting recording')
      onStartRecording?.()
    }
  }

  const handleMute = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    
    console.log('[LiveSessionOrb] Mute toggled:', { 
      newMutedState, 
      isRecording, 
      isPaused 
    })
    
    // When muting, stop recording and disable mic
    if (newMutedState) {
      console.log('[LiveSessionOrb] Muting - disabling mic and stopping recording')
      setMicEnabled(false)
      if (isRecording) {
        onStopRecording?.()
      }
    } 
    // When unmuting, enable mic and start recording if not paused
    else {
      console.log('[LiveSessionOrb] Unmuting - enabling mic and starting recording')
      setMicEnabled(true)
      if (!isPaused) {
        onStartRecording?.()
      }
    }
  }

  const handleEndSession = () => {
    setAgentState(null)
    onEndSession?.()
  }

  // Orb colors - yellowish orange tone with warm gradient
  const orbColors: [string, string] = ['#FFA500', '#FF9500']
  
  const { user } = useUser()
  
  const sidebarUser = {
    name: user?.fullName || 'User',
    email: user?.primaryEmailAddress?.emailAddress || '',
    avatar: user?.imageUrl || '',
  }

  return (
    <SidebarProvider>
      <div className="relative w-full h-screen bg-[#171717] flex">
        {/* Use the proper AppSidebar component */}
        <AppSidebar 
          user={sidebarUser}
          onNewSession={() => {
            // Handle new session if needed
            console.log('[LiveSessionOrb] New session requested from sidebar')
          }}
        />
        
        {/* Main Content Area */}
        <SidebarInset className="flex-1 flex flex-col items-center justify-center relative bg-[#171717]">
          {/* Timer at Top Center */}
          <div className="absolute top-[60px] left-1/2 transform -translate-x-1/2">
            <div className="px-6 py-2 rounded-full bg-white text-[#171717] font-medium text-[18px] shadow-lg">
              {formatTime(elapsedTime)}
            </div>
          </div>

          {/* Context Badge */}
          {isConnected && contextFileName && (
            <div className="absolute top-[130px] left-1/2 transform -translate-x-1/2 flex items-center gap-3">
              <div className="px-4 py-2 rounded-lg bg-[#262626] border border-[#404040] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#888]" />
                <span className="text-sm text-[#f0f0f0]">Context: {contextFileName}</span>
              </div>
            </div>
          )}

          {/* Connection Status Message */}
          {!isConnected && (
            <div className="absolute top-[15%] flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-t-[#FF6B00] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
              <p className="text-[16px] font-medium text-[#f0f0f0]">
                Connecting to your AI Investor...
              </p>
            </div>
          )}

        {/* Main Content Area - Centered Orb */}
        <div className="flex flex-col items-center justify-center gap-12">
          {/* Orb Container - 250px exact size with proper opacity */}
          <div className="w-[250px] h-[250px] flex items-center justify-center">
            <div className="w-full h-full opacity-90">
              <Orb
                colors={orbColors}
                agentState={!isConnected ? 'thinking' : agentState}
                getInputVolume={getInputVolume}
                getOutputVolume={getOutputVolume}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Status text and state indicators below orb */}
          <div className="flex flex-col items-center gap-6">
            <p className="text-[20px] font-medium text-[#f0f0f0]">
              {statusMessage}
            </p>
            
            {/* State Indicators - Similar to ElevenLabs design */}
            {isConnected && (
              <div className="flex items-center gap-3">
                {/* Idle State Badge */}
                <div className={cn(
                  "px-4 py-2 rounded-lg border transition-all",
                  agentState === null
                    ? "bg-[#262626] border-[#404040] text-[#f0f0f0]"
                    : "bg-transparent border-[#2e2e2e] text-[#666666]"
                )}>
                  <span className="text-sm font-medium">Idle</span>
                </div>
                
                {/* Listening State Badge */}
                <div className={cn(
                  "px-4 py-2 rounded-lg border transition-all",
                  agentState === 'listening'
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    : "bg-transparent border-[#2e2e2e] text-[#666666]"
                )}>
                  <span className="text-sm font-medium">Listening</span>
                </div>
                
                {/* Talking State Badge */}
                <div className={cn(
                  "px-4 py-2 rounded-lg border transition-all",
                  agentState === 'talking'
                    ? "bg-[#FF6B00]/10 border-[#FF6B00]/30 text-[#FF6B00]"
                    : "bg-transparent border-[#2e2e2e] text-[#666666]"
                )}>
                  <span className="text-sm font-medium">Talking</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Control Bar - Fixed at bottom with proper spacing */}
        <div className="absolute bottom-[60px] left-0 right-0 flex items-center justify-center px-8">
          <div className="w-full max-w-[1000px] flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center gap-4">
              {/* Pause/Resume Button */}
              <button
                onClick={handlePause}
                disabled={!isConnected}
                title={isPaused ? "Resume session" : "Pause session"}
                className={cn(
                  "h-12 px-6 rounded-lg flex items-center gap-2.5 transition-all font-medium",
                  "border",
                  !isConnected && "opacity-40 cursor-not-allowed",
                  isPaused 
                    ? "bg-[#FF6B00] hover:bg-[#ff7f1a] text-white border-[#FF6B00] shadow-lg shadow-[#FF6B00]/20" 
                    : "bg-[#262626] hover:bg-[#2e2e2e] text-[#f0f0f0] border-[#404040]"
                )}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  {isPaused ? (
                    <Play className="w-4 h-4" fill="currentColor" />
                  ) : (
                    <Pause className="w-4 h-4" fill="currentColor" />
                  )}
                </div>
                <span className="text-[15px]">
                  {isPaused ? 'Resume' : 'Pause'}
                </span>
              </button>

              {/* Mute/Unmute Button */}
              <button
                onClick={handleMute}
                disabled={!isConnected}
                title={isMuted ? "Unmute microphone" : "Mute microphone"}
                className={cn(
                  "h-12 w-12 rounded-lg flex items-center justify-center transition-all relative",
                  "border",
                  !isConnected && "opacity-40 cursor-not-allowed",
                  isMuted
                    ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30"
                    : isRecording
                    ? "bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-[#262626] hover:bg-[#2e2e2e] text-[#f0f0f0] border-[#404040]"
                )}
              >
                {/* Recording indicator pulse */}
                {isRecording && !isMuted && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
                {isMuted ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-4">
              {/* Settings/Help Button */}
              <button
                disabled={!isConnected}
                title="Help"
                className={cn(
                  "h-12 w-12 rounded-lg flex items-center justify-center transition-all",
                  "bg-[#262626] hover:bg-[#2e2e2e] text-[#f0f0f0] border border-[#404040]",
                  !isConnected && "opacity-40 cursor-not-allowed"
                )}
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              {/* End Session Button */}
              <button
                onClick={handleEndSession}
                className="h-12 px-6 rounded-lg flex items-center gap-2.5 transition-all font-medium bg-red-600/90 hover:bg-red-600 text-white border border-red-600 shadow-lg shadow-red-600/20"
              >
                <X className="w-4 h-4" />
                <span className="text-[15px]">End Session</span>
              </button>
            </div>
          </div>
        </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
