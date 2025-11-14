"use client"

/**
 * LiveSessionOrb Component
 * 
 * A full-screen live session interface featuring an animated 3D orb with three distinct states:
 * 
 * 1. IDLE (null): Orb is stationary/minimal animation when microphone is disabled or muted
 * 2. LISTENING: Orb reacts to input volume when user is speaking (microphone enabled)
 * 3. TALKING: Orb reacts to output volume when AI is responding
 * 
 * Colors: Yellowish-orange gradient ['#FFA500', '#FF9500'] with 70% opacity
 */

import { useState, useEffect, useRef } from 'react'
import { Orb, AgentState } from '@/components/ui/orb'
import { Button } from '@/components/ui/button'
import { Pause, Mic, Settings, X, Loader2, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LiveSessionOrbProps {
  onEndSession?: () => void
  onBack?: () => void
  sessionId?: string
  contextFiles?: any[]
  isConnected?: boolean
  isRecording?: boolean
}

export function LiveSessionOrb({ 
  onEndSession, 
  onBack, 
  sessionId, 
  contextFiles,
  isConnected = false,
  isRecording = false
}: LiveSessionOrbProps) {
  // Three distinct states:
  // null (idle) - microphone not enabled
  // listening - microphone enabled, user speaking
  // talking - AI responding
  const [agentState, setAgentState] = useState<AgentState>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [micEnabled, setMicEnabled] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('Connecting to your AI Investor...')
  const [statusMessage, setStatusMessage] = useState('Almost ready...')
  
  // Audio volume refs for orb reactivity
  const inputVolumeRef = useRef<number>(0)
  const outputVolumeRef = useRef<number>(0)

  // Update agent state based on connection, mic, and recording status
  useEffect(() => {
    if (!isConnected) {
      // Connecting state - show thinking animation
      setAgentState('thinking')
      setConnectionStatus('Connecting to your AI Investor...')
      setStatusMessage('Almost ready...')
    } else if (isPaused) {
      // Paused state - idle orb
      setAgentState(null)
      setConnectionStatus('Session Paused')
      setStatusMessage('Click Resume to continue')
    } else if (!micEnabled || isMuted) {
      // Microphone disabled - idle state
      setAgentState(null)
      setConnectionStatus('Connected')
      setStatusMessage('Enable microphone to start')
    } else if (isRecording) {
      // User is speaking - listening state
      setAgentState('listening')
      setConnectionStatus('Connected')
      setStatusMessage('Marcus is listening...')
    } else {
      // AI is responding - talking state
      setAgentState('talking')
      setConnectionStatus('Connected')
      setStatusMessage('Marcus is speaking...')
    }
  }, [isConnected, isRecording, isPaused, micEnabled, isMuted])

  // Simulate connection process and enable microphone
  useEffect(() => {
    const timer = setTimeout(() => {
      setConnectionStatus('Connected')
      setMicEnabled(true) // Enable mic after connection
      setStatusMessage('Ready to pitch!')
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Get input volume for microphone - active during listening state
  const getInputVolume = () => {
    if (agentState === 'listening' && micEnabled && !isMuted && !isPaused) {
      // Simulate microphone input volume with natural variation
      inputVolumeRef.current = 0.3 + Math.random() * 0.7
      return inputVolumeRef.current
    }
    return 0
  }

  // Get output volume for AI speaking - active during talking state
  const getOutputVolume = () => {
    if (agentState === 'talking' && !isPaused) {
      // Simulate AI speaking volume with natural variation
      outputVolumeRef.current = 0.4 + Math.random() * 0.6
      return outputVolumeRef.current
    }
    return 0
  }

  const handlePause = () => {
    setIsPaused(!isPaused)
    // State will be updated by the useEffect that watches isPaused
  }

  const handleMute = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    // When muted, disable mic which sets orb to idle state
    if (newMutedState) {
      setMicEnabled(false)
    } else {
      setMicEnabled(true)
    }
  }

  const handleEndSession = () => {
    setAgentState(null)
    onEndSession?.()
  }

  // Orb colors - yellowish orange tone with warm gradient
  const orbColors: [string, string] = ['#FFA500', '#FF9500']

  return (
    <div className="flex flex-col items-center justify-between h-full w-full bg-[#171717] rounded-tl-[40px] border-l border-t border-[#2c2c33] p-[60px] pt-[200px] pb-[60px]">
      {/* Top Status */}
      <div className="flex items-center justify-center gap-3">
        {!isConnected && (
          <Loader2 className="w-6 h-6 text-[#FF6B00] animate-spin" />
        )}
        {isConnected && (
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          </div>
        )}
        <p 
          className="text-[18px] font-medium font-['Uber_Move'] text-center"
          style={{
            background: 'linear-gradient(to right, #ffffff, rgba(153,153,153,0.8))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          {connectionStatus}
        </p>
      </div>

      {/* Center - Orb */}
      <div className="flex flex-col items-center gap-16">
        <div className="w-[250px] h-[250px] relative opacity-70">
          <Orb
            colors={orbColors}
            agentState={!isConnected ? 'thinking' : agentState}
            getInputVolume={getInputVolume}
            getOutputVolume={getOutputVolume}
            className="w-full h-full"
          />
        </div>

        <div className="flex flex-col items-center justify-center gap-3">
          <p className="text-[18px] font-medium font-['Uber_Move'] text-[#f0f0f0] text-center">
            {statusMessage}
          </p>
          {isConnected && (
            <div className="flex items-center gap-2 text-sm text-[#9e9e9e]">
              <div className={cn(
                "w-2 h-2 rounded-full",
                agentState === null && "bg-gray-400",
                agentState === 'listening' && "bg-blue-400 animate-pulse",
                agentState === 'talking' && "bg-green-400 animate-pulse"
              )} />
              <span>
                {agentState === null && "Idle"}
                {agentState === 'listening' && "Listening"}
                {agentState === 'talking' && "Speaking"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar - Controls */}
      <div className="flex items-center justify-between w-full max-w-[1008px]">
        {/* Left Controls */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handlePause}
            disabled={!isConnected}
            className={cn(
              "bg-[#2e2e31] hover:bg-[#3e3e41] text-[#9e9e9e] h-[48px] px-8 rounded-xl",
              "flex items-center gap-3 shadow-sm",
              isPaused && "bg-[#FF6B00] hover:bg-[#FF8533] text-white"
            )}
          >
            {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
            <span className="font-bold text-[16px]">
              {isPaused ? 'Resume' : 'Pause'}
            </span>
          </Button>

          <Button
            onClick={handleMute}
            disabled={!isConnected}
            className={cn(
              "h-[48px] w-[48px] p-0 rounded-xl shadow-sm",
              isMuted 
                ? "bg-red-500/20 hover:bg-red-500/30 text-red-500" 
                : "bg-[#2e2e31] hover:bg-[#3e3e41] text-[#9e9e9e]"
            )}
          >
            <Mic className="w-6 h-6" />
          </Button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4">
          <Button
            disabled={!isConnected}
            className="bg-[#2e2e31] hover:bg-[#3e3e41] text-[#9e9e9e] h-[48px] w-[48px] p-0 rounded-xl shadow-sm"
          >
            <Settings className="w-6 h-6" />
          </Button>

          <Button
            onClick={handleEndSession}
            className="bg-[#902f31] hover:bg-[#a03436] text-[#f0f0f0] h-[48px] px-8 rounded-xl flex items-center gap-2 shadow-sm"
          >
            <X className="w-6 h-6" />
            <span className="font-bold text-[16px]">End Session</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
