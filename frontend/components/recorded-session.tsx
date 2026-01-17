"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, Square, Paperclip } from "lucide-react"
import Image from "next/image"
import { LiveWaveform } from "@/components/ui/live-waveform"

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
    <div className="flex-1 bg-[#171717] rounded-tl-[40px] border-l border-t border-[#2c2c33] flex flex-col min-h-screen overflow-y-auto scrollbar-hide">
      {/* Main Content Container */}
      <div className="flex-1 flex items-center justify-center p-8">
        {/* Centered Card - Exact Figma Design */}
        <div className="w-full max-w-[600px] bg-[#262626] rounded-[24px] p-[24px] flex flex-col gap-[20px]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="font-['Inter'] font-bold text-[18px] text-[#f0f0f0] leading-[28px]">
              Analysis & Feedback
            </h2>
          </div>

          {/* Context Info */}
          <div className="bg-[#171717] rounded-[16px] p-[12px]">
            <p className="font-['Uber_Move'] text-[16px] text-[#9e9e9e] leading-[24px]">
              Join a live AI investor call that reacts, questions, and scores your performance
            </p>
          </div>

          {/* Waveform / Status Display */}
          <div className="flex flex-col items-center gap-[16px] py-8">
            <LiveWaveform
              active={isRecording}
              barColor="#ff6b00"
              height={60}
              barWidth={6}
              barGap={10}
              fadeEdges={false}
            />

            {/* Recording Status Text */}
            {isRecording && (
              <p className="font-['Uber_Move'] text-[16px] text-[#9e9e9e]">
                Recording your pitch...
              </p>
            )}

            {!isRecording && !hasRecording && (
              <p className="font-['Uber_Move'] text-[16px] text-[#9e9e9e]">
                Press to record or upload
              </p>
            )}

            {/* Recording Time Display - Only for recorded audio */}
            {isRecording && (
              <p className="font-['Uber_Move'] text-[24px] text-[#f0f0f0] font-medium">
                {formatTime(recordingTime)}
              </p>
            )}

            {/* Uploaded Audio File Display */}
            {audioMode === 'upload' && hasRecording && uploadedAudioFile && (
              <div className="bg-[#171717] rounded-[16px] p-[12px] flex items-center gap-[12px] w-full max-w-[300px] relative">
                <div className="w-[40px] h-[40px] bg-[#262626] rounded-[8px] flex items-center justify-center flex-shrink-0">
                  🎵
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-['Uber_Move'] text-[14px] text-[#f0f0f0] truncate">
                    {uploadedAudioFile.name}
                  </p>
                  <p className="font-['Uber_Move'] text-[12px] text-[#9e9e9e]">
                    {(uploadedAudioFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={handleRemoveAudio}
                  className="w-[24px] h-[24px] rounded-full bg-[#404040] hover:bg-[#505050] flex items-center justify-center transition-colors flex-shrink-0"
                  title="Remove audio"
                >
                  <svg className="w-[12px] h-[12px] text-[#f0f0f0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Recorded Audio Time Display */}
            {audioMode === 'record' && hasRecording && !isRecording && (
              <p className="font-['Uber_Move'] text-[24px] text-[#f0f0f0] font-medium">
                {formatTime(recordingTime)}
              </p>
            )}
          </div>

          {/* File Display (After Recording) */}
          {hasRecording && uploadedFiles.length > 0 && (
            <div className="bg-[#171717] rounded-[16px] p-[12px] flex items-center gap-[12px]">
              <div className="w-[40px] h-[40px] bg-[#262626] rounded-[8px] flex items-center justify-center">
                📄
              </div>
              <div className="flex-1">
                <p className="font-['Uber_Move'] text-[14px] text-[#f0f0f0]">
                  {uploadedFiles[0].filename}
                </p>
                <p className="font-['Uber_Move'] text-[12px] text-[#9e9e9e]">
                  {Math.round(uploadedFiles[0].file.size / 1024)} KB
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-[16px]">
            {/* Show both Record and Upload buttons initially */}
            {!hasRecording && (
              <>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={`flex-1 h-[44px] rounded-[12px] flex items-center justify-center gap-[8px] font-['Uber_Move'] font-medium text-[16px] transition-colors ${isRecording
                    ? 'bg-[#902f31] text-[#f0f0f0]'
                    : 'bg-[#f0f0f0] text-[#262626]'
                    }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-[20px] h-[20px] fill-current" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="w-[20px] h-[20px]" />
                      Record
                    </>
                  )}
                </button>

                {/* Upload Button */}
                {!isRecording && (
                  <button
                    onClick={() => document.getElementById('audio-upload-input')?.click()}
                    disabled={isProcessing}
                    className="w-[44px] h-[44px] rounded-[12px] bg-[#ff6b00] flex items-center justify-center hover:bg-[#ff8c00] transition-colors"
                    title="Upload audio file"
                  >
                    <Paperclip className="w-[20px] h-[20px] text-[#f0f0f0] rotate-45" />
                  </button>
                )}

                <input
                  id="audio-upload-input"
                  type="file"
                  accept=".mp3,.wav,audio/mpeg,audio/wav,audio/wave,audio/x-wav"
                  onChange={handleAudioFileSelect}
                  className="hidden"
                />
              </>
            )}

            {/* Re-record Button (After Recording/Upload) */}
            {hasRecording && (
              <button
                onClick={handleRemoveAudio}
                disabled={isProcessing}
                className="flex-1 h-[44px] rounded-[12px] bg-[#f0f0f0] text-[#262626] flex items-center justify-center gap-[8px] font-['Uber_Move'] font-medium text-[16px]"
              >
                <Mic className="w-[20px] h-[20px]" />
                Re-record
              </button>
            )}
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="bg-[#171717] rounded-[16px] p-[12px] text-center">
              <p className="font-['Uber_Move'] text-[14px] text-[#ff6b00] animate-pulse">
                Processing your pitch...
              </p>
            </div>
          )}

          {/* Proceed with Pitch Button (shows after recording) */}
          {hasRecording && (
            <button
              onClick={handleProceedWithPitch}
              disabled={isProcessing}
              className="w-full h-[44px] rounded-[12px] bg-[#ff6b00] text-[#f0f0f0] font-['Uber_Move'] font-bold text-[16px] disabled:opacity-50 hover:bg-[#ff8c00] transition-colors"
            >
              {isProcessing ? 'Processing...' : 'Proceed with recorded pitch'}
            </button>
          )}

          {/* End Session Button (always visible) */}
          <button
            onClick={handleEndSession}
            disabled={isProcessing}
            className="w-full h-[44px] rounded-[12px] bg-[#404040] text-[#f0f0f0] font-['Uber_Move'] font-medium text-[16px] disabled:opacity-50 hover:bg-[#505050] transition-colors"
          >
            Cancel Session
          </button>
        </div>
      </div>
    </div>
  )
}
