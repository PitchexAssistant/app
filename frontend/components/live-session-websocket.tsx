"use client"

/**
 * LiveSessionWebSocket Component
 * 
 * A WebSocket-based live session component that uses the Gemini Live API directly.
 * This is a fallback when LiveKit is not configured, and integrates with Edge TTS
 * for text-to-speech conversion.
 */

import { useState, useEffect, useCallback } from 'react'
import { useLiveSession, SessionMode } from '@/hooks/use-live-session'
import { LiveSessionOrb } from '@/components/live-session-orb'

interface LiveSessionWebSocketProps {
    sessionId?: string
    onEndSession: () => void
    contextFiles?: any[]
}

export function LiveSessionWebSocket({
    sessionId = "default-session",
    onEndSession,
    contextFiles = []
}: LiveSessionWebSocketProps) {
    const [connectionFailed, setConnectionFailed] = useState(false)

    const {
        isConnected,
        isConnecting,
        isRecording,
        isUserSpeaking,
        isAISpeaking,
        messages,
        currentMode,
        summary,
        error,
        startSession,
        endSession,
        startRecording,
        stopRecording,
        sendText,
        changeMode,
    } = useLiveSession({
        sessionId,
        mode: 'pitch',
        context: contextFiles?.map(f => f.filename).join(', '),
        onError: (err) => {
            console.error('[LiveSessionWebSocket] Error:', err)
            if (err.includes('timeout') || err.includes('Connection')) {
                setConnectionFailed(true)
            }
        },
        onMessage: (msg) => {
            console.log('[LiveSessionWebSocket] Message:', msg)
        }
    })

    // Auto-start session on mount
    useEffect(() => {
        console.log('[LiveSessionWebSocket] Starting session...')
        startSession()

        return () => {
            console.log('[LiveSessionWebSocket] Cleaning up session...')
        }
    }, [])

    const handleEndSession = useCallback(async () => {
        try {
            await endSession()
        } catch (e) {
            console.error('[LiveSessionWebSocket] Error ending session:', e)
        }
        onEndSession()
    }, [endSession, onEndSession])

    const handleStartRecording = useCallback(() => {
        console.log('[LiveSessionWebSocket] Starting recording...')
        startRecording()
    }, [startRecording])

    const handleStopRecording = useCallback(() => {
        console.log('[LiveSessionWebSocket] Stopping recording...')
        stopRecording()
    }, [stopRecording])

    const contextFileName = contextFiles && contextFiles.length > 0
        ? contextFiles[0].filename
        : undefined

    return (
        <LiveSessionOrb
            sessionId={sessionId}
            isConnected={isConnected}
            isRecording={isRecording}
            isAISpeaking={isAISpeaking}
            isUserSpeaking={isUserSpeaking}
            onEndSession={handleEndSession}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            contextFiles={contextFiles}
            contextFileName={contextFileName}
            error={connectionFailed ? 'Connection failed. Please check your network and try again.' : error}
            pitchMode="live"
        />
    )
}
