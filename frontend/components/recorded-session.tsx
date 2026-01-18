"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, Square, Paperclip, X, Upload, Send, Loader2 } from "lucide-react"
import Image from "next/image"
import { LiveWaveform } from "@/components/ui/live-waveform"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useUser } from "@clerk/nextjs"
import { useSessions } from "@/hooks/use-sessions"

interface RecordedSessionProps {
  uploadedFiles: Array<{
    filename: string
    file_id?: string
    file_index: number
    local_url?: string
    file: File
  }>
  onEndSession: () => void
  onShowResults: (audioBlob: Blob, transcript: string, analysis: any) => void
  sessionId: string
  userId: string  // User ID for API authentication
}

export function RecordedSession({
  uploadedFiles,
  onEndSession,
  onShowResults,
  sessionId,
  userId
}: RecordedSessionProps) {
  const { user } = useUser()
  const { } = useSessions() // For potential session operations

  const [isRecording, setIsRecording] = useState(false)
  const [hasRecording, setHasRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes in seconds
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioLevels, setAudioLevels] = useState<number[]>([20, 25, 30, 25, 35, 30, 25, 28, 22])

  // New states for upload functionality
  const [audioMode, setAudioMode] = useState<'none' | 'record' | 'upload'>('none')
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null)
  const [uploadedAudioURL, setUploadedAudioURL] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // User data for sidebar
  const sidebarUser = {
    name: user?.fullName || 'User',
    email: user?.primaryEmailAddress?.emailAddress || '',
    avatar: user?.imageUrl || '',
  }

  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.fromTo(".session-gradient",
      { y: "-100%", opacity: 0.8 },
      { y: "-40%", duration: 5, ease: "power2.out", delay: 0.3 }
    );
  }, { scope: containerRef });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)

  // Timer effect for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1)
        setTimeRemaining(prev => Math.max(0, prev - 1))
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRecording])

  // Auto-stop recording at 5 minutes
  useEffect(() => {
    if (timeRemaining === 0 && isRecording) {
      stopRecording()
    }
  }, [timeRemaining, isRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const updateAudioLevels = () => {
    if (!analyzerRef.current || !isRecording) {
      // Reset to base heights when not recording
      setAudioLevels([20, 25, 30, 25, 35, 30, 25, 28, 22])
      return
    }

    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount)
    analyzerRef.current.getByteFrequencyData(dataArray)

    // Get 9 frequency bands for real-time visualization
    const newLevels: number[] = []
    const bandSize = Math.floor(dataArray.length / 9)

    for (let i = 0; i < 9; i++) {
      const start = i * bandSize
      const end = start + bandSize
      const bandData = dataArray.slice(start, end)
      const average = bandData.reduce((a, b) => a + b, 0) / bandData.length

      // Map to Figma design range: 20px to 60px (matching Figma bars)
      const normalized = average / 255

      // Apply sensitivity boost for better visual response
      // When silent (< 5), stay at minimum; when audio present, amplify
      const amplified = average < 5 ? 0 : Math.pow(normalized, 0.8)
      const height = 20 + (amplified * 40) // Range: 20-60px (exact Figma range)

      newLevels.push(height)
    }

    // Smooth interpolation for natural movement
    setAudioLevels(prevLevels =>
      prevLevels.map((prev, i) => {
        const target = newLevels[i]
        // Fast response to audio input
        return prev + (target - prev) * 0.4
      })
    )

    animationFrameRef.current = requestAnimationFrame(updateAudioLevels)
  }

  const startRecording = async () => {
    try {
      setAudioMode('record')

      // Clear any uploaded audio
      if (uploadedAudioFile) {
        if (uploadedAudioURL) {
          URL.revokeObjectURL(uploadedAudioURL)
        }
        setUploadedAudioFile(null)
        setUploadedAudioURL(null)
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })

      // Set up audio analysis for waveform with optimized settings
      audioContextRef.current = new AudioContext()
      analyzerRef.current = audioContextRef.current.createAnalyser()

      // Optimized settings for real-time visualization like ElevenLabs/Gemini
      analyzerRef.current.fftSize = 512 // Higher resolution for smoother bars
      analyzerRef.current.smoothingTimeConstant = 0.7 // Smooth but responsive (0-1)
      analyzerRef.current.minDecibels = -90 // Capture quiet sounds
      analyzerRef.current.maxDecibels = -10 // Avoid clipping

      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyzerRef.current)

      // Start audio level monitoring
      updateAudioLevels()

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setHasRecording(true)

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())

        // Cleanup audio context
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        if (audioContextRef.current) {
          audioContextRef.current.close()
        }

        // Reset audio levels to static
        setAudioLevels([20, 20, 20, 20, 20, 20, 20, 20, 20])
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const convertToMP3 = async (webmBlob: Blob): Promise<Blob> => {
    // For now, we'll send the webm directly as the backend can handle it
    // In production, you might want to use a library like lamejs or ffmpeg.wasm
    // to convert to MP3 on the client side
    return webmBlob
  }

  const handleUploadAudio = async () => {
    if (!audioBlob || !sessionId) {
      alert('No recording available to upload')
      return
    }

    setIsProcessing(true)
    try {
      // Convert to MP3 (or send webm which backend accepts)
      const audioToUpload = await convertToMP3(audioBlob)

      // Upload and transcribe
      const formData = new FormData()
      formData.append('file', audioToUpload, 'recording.mp3')

      const transcribeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/stt/transcribe`, {
        method: 'POST',
        body: formData
      })

      if (!transcribeResponse.ok) {
        throw new Error('Failed to transcribe audio')
      }

      const transcriptionData = await transcribeResponse.json()

      // Update session with chat_history to trigger auto-title generation
      if (sessionId) {
        try {
          console.log('[RecordedSession] Updating session with transcript for title generation:', sessionId)
          const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sessions/${sessionId}?user_id=${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_history: [{ role: 'human', content: transcriptionData.transcript }],
              transcript: transcriptionData.transcript
            })
          })
          if (updateResponse.ok) {
            const updatedSession = await updateResponse.json()
            console.log('[RecordedSession] Session updated, new title:', updatedSession.title)
          } else {
            const errorData = await updateResponse.json().catch(() => ({}))
            console.error('[RecordedSession] Session update failed:', updateResponse.status, errorData)
          }
        } catch (err) {
          console.error('[RecordedSession] Failed to update session title:', err)
        }
      } else {
        console.warn('[RecordedSession] No sessionId provided, cannot update title')
      }

      // Get analysis with context
      const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/llm/analyze-pitch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          transcript: transcriptionData.transcript,
          duration: recordingTime
        })
      })

      if (!analysisResponse.ok) {
        throw new Error('Failed to analyze pitch')
      }

      const analysisData = await analysisResponse.json()

      // Update session with analysis data and mark as complete
      if (sessionId) {
        try {
          console.log('[RecordedSession] Saving analysis and marking session complete')
          // First update with analysis
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sessions/${sessionId}?user_id=${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              analysis: analysisData,
              transcript: transcriptionData.transcript,
              status: 'completed'
            })
          })
          // Then mark as complete via the complete endpoint
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sessions/${sessionId}/complete?user_id=${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
          console.log('[RecordedSession] Session marked as complete')
        } catch (err) {
          console.error('[RecordedSession] Failed to mark session complete:', err)
        }
      }

      // Show results page
      onShowResults(audioBlob, transcriptionData.transcript, analysisData)

    } catch (error) {
      console.error('Error uploading audio:', error)
      alert('Failed to process recording. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProceedWithPitch = () => {
    if (!hasRecording) {
      alert('Please record or upload your pitch first')
      return
    }

    if (audioMode === 'upload') {
      handleProceedWithUpload()
    } else {
      handleUploadAudio()
    }
  }

  const handleEndSession = () => {
    if (isRecording) {
      stopRecording()
    }
    onEndSession()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // File validation
  const validateAudioFile = (file: File): boolean => {
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav']
    const validExtensions = /\.(mp3|wav)$/i

    if (!validTypes.includes(file.type) && !file.name.match(validExtensions)) {
      setUploadError('Please upload only MP3 or WAV files')
      return false
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB')
      return false
    }

    return true
  }

  // Handle audio file selection
  const handleAudioFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadError(null)

    if (!validateAudioFile(file)) {
      return
    }

    setAudioMode('upload')
    setUploadedAudioFile(file)
    setUploadedAudioURL(URL.createObjectURL(file))
    setHasRecording(true)

    if (audioBlob) {
      setAudioBlob(null)
    }
  }

  // Handle removing audio
  const handleRemoveAudio = () => {
    if (audioMode === 'upload') {
      if (uploadedAudioURL) {
        URL.revokeObjectURL(uploadedAudioURL)
      }
      setUploadedAudioFile(null)
      setUploadedAudioURL(null)
      setUploadError(null)
    } else if (audioMode === 'record') {
      setAudioBlob(null)
    }
    setAudioMode('none')
    setHasRecording(false)
    setRecordingTime(0)
    setTimeRemaining(300)
  }

  // Handle proceed with uploaded audio
  const handleProceedWithUpload = async () => {
    if (!uploadedAudioFile || !sessionId) return

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadedAudioFile)

      const transcribeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/stt/transcribe`, {
        method: 'POST',
        body: formData
      })

      if (!transcribeResponse.ok) {
        throw new Error('Failed to transcribe audio')
      }

      const transcriptionData = await transcribeResponse.json()

      // Update session with chat_history to trigger auto-title generation
      if (sessionId) {
        try {
          console.log('[RecordedSession Upload] Updating session with transcript for title generation:', sessionId)
          const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sessions/${sessionId}?user_id=${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_history: [{ role: 'human', content: transcriptionData.transcript }],
              transcript: transcriptionData.transcript
            })
          })
          if (updateResponse.ok) {
            const updatedSession = await updateResponse.json()
            console.log('[RecordedSession Upload] Session updated, new title:', updatedSession.title)
          } else {
            const errorData = await updateResponse.json().catch(() => ({}))
            console.error('[RecordedSession Upload] Session update failed:', updateResponse.status, errorData)
          }
        } catch (err) {
          console.error('[RecordedSession Upload] Failed to update session title:', err)
        }
      } else {
        console.warn('[RecordedSession Upload] No sessionId provided, cannot update title')
      }

      const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/llm/analyze-pitch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          transcript: transcriptionData.transcript,
          duration: 0
        })
      })

      if (!analysisResponse.ok) {
        throw new Error('Failed to analyze pitch')
      }

      const analysisData = await analysisResponse.json()

      // Update session with analysis data and mark as complete
      if (sessionId) {
        try {
          console.log('[RecordedSession Upload] Saving analysis and marking session complete')
          // First update with analysis
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sessions/${sessionId}?user_id=${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              analysis: analysisData,
              transcript: transcriptionData.transcript,
              status: 'completed'
            })
          })
          // Then mark as complete via the complete endpoint
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sessions/${sessionId}/complete?user_id=${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
          console.log('[RecordedSession Upload] Session marked as complete')
        } catch (err) {
          console.error('[RecordedSession Upload] Failed to mark session complete:', err)
        }
      }

      onShowResults(uploadedAudioFile, transcriptionData.transcript, analysisData)

    } catch (error) {
      console.error('Error processing uploaded audio:', error)
      alert('Failed to process audio. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }



  return (
    <SidebarProvider>
      <div ref={containerRef} className="fixed inset-0 z-50 bg-surface-0 flex overflow-hidden">
        <AppSidebar user={sidebarUser} onNewSession={onEndSession} />

        <SidebarInset className="flex-1 flex items-center justify-center relative bg-surface-0 overflow-hidden">
          {/* Gradient Background Layer */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Left Globe - Pink center to dark outer */}
            <div
              className="session-gradient absolute -bottom-[40%] -left-[45%] w-[100vw] h-[100vw] rounded-full blur-[120px] opacity-90"
              style={{
                background: `
                          radial-gradient(circle at center, 
                              rgba(205, 100, 120, 0.9) 0%, 
                              rgba(160, 85, 110, 0.7) 25%, 
                              rgba(110, 70, 95, 0.5) 50%, 
                              rgba(70, 55, 75, 0.3) 75%, 
                              transparent 100%
                          )
                      `,
                transform: "translateY(100%)"
              }}
            />
            {/* Right Globe - Pink center to dark outer */}
            <div
              className="session-gradient absolute -bottom-[40%] -right-[45%] w-[100vw] h-[100vw] rounded-full blur-[120px] opacity-90"
              style={{
                background: `
                          radial-gradient(circle at center, 
                              rgba(205, 100, 120, 0.9) 0%, 
                              rgba(160, 85, 110, 0.7) 25%, 
                              rgba(110, 70, 95, 0.5) 50%, 
                              rgba(70, 55, 75, 0.3) 75%,
                              transparent 100%
                          )
                      `,
                transform: "translateY(100%)"
              }}
            />
          </div>

          <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center">
            {/* Header - No background wrapper */}
            <div className="text-center mb-12">
              <h2 className="font-semibold text-text-primary mb-4">
                AI-Powered Pitch Analysis
              </h2>
              <p className="text-text-primary text-base leading-relaxed max-w-md mx-auto">
                Our advanced AI captures your emotions, tone, and delivery in real-time,
                providing comprehensive feedback to help you improve.
              </p>
            </div>

            {/* Waveform - Always visible */}
            <div className="mb-12 w-full max-w-md">
              <LiveWaveform
                active={isRecording}
                barColor="#FBFF50"
                height={60}
                barWidth={4}
                barGap={3}
                barRadius={2}
                fadeEdges={true}
                fadeWidth={40}
                smoothingTimeConstant={0.85}
              />
            </div>

            {/* Recording Status */}
            {isRecording && (
              <div className="text-center mb-8">
                <p className="text-4xl font-mono font-bold text-text-primary">
                  {formatTime(recordingTime)}
                </p>
                <p className="text-sm text-text-secondary mt-2">Recording...</p>
              </div>
            )}

            {/* Main Record Button - Large Round Secondary */}
            {!isRecording && !hasRecording && (
              <button
                onClick={startRecording}
                disabled={isProcessing}
                className="size-28 rounded-full bg-surface-2 hover:bg-surface-3 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mb-12 border border-gray"
              >
                <Mic className="size-10" />
              </button>
            )}

            {/* Stop Recording Button */}
            {isRecording && (
              <Button
                size="lg"
                variant="destructive"
                onClick={stopRecording}
                className="size-28 rounded-full animate-pulse flex items-center justify-center p-0 mb-8"
              >
                <Square className="size-10 fill-current" />
              </Button>
            )}

            {/* Uploaded Audio File Display */}
            {audioMode === 'upload' && hasRecording && uploadedAudioFile && (
              <div className="w-full max-w-sm bg-surface-1/50 backdrop-blur-sm rounded-xl p-4 border border-surface-3 flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                    <Upload className="size-5" />
                  </div>
                  <div>
                    <p className="text-text-primary font-medium text-sm truncate max-w-[180px]">
                      {uploadedAudioFile.name}
                    </p>
                    <p className="text-text-tertiary text-xs">
                      {(uploadedAudioFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveAudio}
                  className="p-2 rounded-full hover:bg-surface-2 text-text-tertiary hover:text-red transition-colors"
                  title="Remove audio"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            {/* Recorded Audio Ready Display */}
            {audioMode === 'record' && hasRecording && !isRecording && (
              <div className="w-full max-w-sm bg-surface-1/50 backdrop-blur-sm rounded-xl p-4 border border-surface-3 flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                    <Mic className="size-5" />
                  </div>
                  <div>
                    <p className="text-text-primary font-medium text-sm">
                      Recorded Session
                    </p>
                    <p className="text-text-secondary text-xs">
                      {formatTime(recordingTime)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveAudio}
                  className="p-2 rounded-full hover:bg-surface-2 text-text-tertiary hover:text-red transition-colors"
                  title="Remove audio"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            {/* Action Buttons (Proceed) - After recording */}
            {hasRecording && !isRecording && (
              <div className="w-full flex justify-center items-center max-w-sm">
                <Button
                  size="lg"
                  onClick={handleProceedWithPitch}
                  disabled={isProcessing}
                  className=" h-11 text-base rounded-xl gap-2 bg-accent-lime hover:bg-accent-lime/90 text-surface-0 font-medium"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-6 w-6" />
                      Proceed with Pitch
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Bottom Buttons - Upload and Cancel */}
            {!isRecording && !hasRecording && (
              <div className="flex items-center gap-4 w-full max-w-sm">
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1 h-11 rounded-lg bg-surface-2 backdrop-blur-sm border-surface-3 text-text-secondary hover:text-text-primary hover:bg-surface-2 gap-2"
                  onClick={() => document.getElementById('audio-upload-input')?.click()}
                  disabled={isProcessing}
                >
                  <Upload className="size-4" />
                  Upload
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  className="flex-1 h-11 rounded-lg gap-2"
                  onClick={handleEndSession}
                >
                  <X className="size-4" />
                  End Session
                </Button>
              </div>
            )}

            <input
              id="audio-upload-input"
              type="file"
              accept=".mp3,.wav,audio/mpeg,audio/wav,audio/wave,audio/x-wav"
              onChange={handleAudioFileSelect}
              className="hidden"
            />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
