"use client";

/**
 * Interactive Pitch Session with Voice Activity Detection
 * Auto-detects voice → Listening state
 * TTS playback → Talking state
 */

import { useState, useEffect, useRef } from 'react';
import { useInteractivePitch, Message } from '@/hooks/use-interactive-pitch';
import { Orb, AgentState } from '@/components/ui/orb';
import { Pause, Play, Mic, MicOff, X, MessageSquare, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useUser } from '@clerk/nextjs';
import { useSessions } from '@/hooks/use-sessions';
import { Session } from '@/lib/api/client';

interface InteractivePitchSessionProps {
    sessionId?: string;
    onEndSession: () => void;
    onComplete?: (session: Session) => void;  // Called when session ends with completed session data
    contextFiles?: any[];
}

export function InteractivePitchSession({
    sessionId,
    onEndSession,
    onComplete,
    contextFiles = []
}: InteractivePitchSessionProps) {
    const { user } = useUser();
    const { updateSession, completeSession, loadSession } = useSessions();
    const [isPaused, setIsPaused] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [startTime] = useState(Date.now());
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        isConnected,
        isRecording,
        isUserSpeaking,
        isAISpeaking,
        isProcessing,
        messages,
        error,
        startRecording,
        stopRecording,
        sendText,
        resetConversation,
        disconnect,
        currentEmotion,
    } = useInteractivePitch({
        sessionId,
        onTranscription: (text) => console.log('[Session] You:', text),
        onResponse: (text) => console.log('[Session] Marcus:', text),
        onError: (err) => console.error('[Session] Error:', err),
    });

    // Timer
    useEffect(() => {
        if (!isConnected) return;
        const interval = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [isConnected, startTime]);

    // Auto-scroll transcript
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Save chat_history to backend whenever messages change - triggers auto-title generation
    useEffect(() => {
        if (!sessionId || messages.length === 0) return;

        const chatHistory = messages.map(m => ({
            role: (m.role === 'user' ? 'human' : 'ai') as 'human' | 'ai',
            content: m.content,
            timestamp: Math.floor(Date.now() / 1000)
        }));

        // Save chat_history to backend (triggers auto-title on first user message)
        updateSession(sessionId, { chat_history: chatHistory }).catch(err => {
            console.error('[InteractivePitchSession] Failed to save chat_history:', err);
        });
    }, [messages, sessionId, updateSession]);

    // Auto-start recording when connected (only once per connection)
    const hasAutoStarted = useRef(false);
    useEffect(() => {
        if (isConnected && !isRecording && !isPaused && !hasAutoStarted.current) {
            hasAutoStarted.current = true;
            // Small delay to ensure WebSocket is fully ready
            const timer = setTimeout(() => {
                startRecording();
            }, 200);
            return () => clearTimeout(timer);
        }

        // Reset the flag when disconnected
        if (!isConnected) {
            hasAutoStarted.current = false;
        }
    }, [isConnected, isRecording, isPaused, startRecording]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Determine orb state based on actual activity
    const getAgentState = (): AgentState => {
        if (!isConnected) return 'thinking';
        if (isPaused) return null;
        if (isAISpeaking) return 'talking';
        if (isUserSpeaking) return 'listening';
        if (isProcessing) return 'thinking';
        return null; // Idle
    };

    // Status message
    const getStatusMessage = (): string => {
        if (!isConnected) return 'Connecting...';
        if (isPaused) return 'Paused';
        if (isAISpeaking) return 'Marcus is speaking...';
        if (isUserSpeaking) return 'Listening...';
        if (isProcessing) return 'Thinking...';
        return 'Idle';
    };

    const handlePauseToggle = () => {
        if (isPaused) {
            startRecording();
        } else {
            stopRecording();
        }
        setIsPaused(!isPaused);
    };

    const handleMicToggle = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (textInput.trim() && !isProcessing && !isAISpeaking) {
            sendText(textInput);
            setTextInput('');
        }
    };

    const handleEndSession = async () => {
        stopRecording();
        disconnect();

        // Complete the session and save final data
        if (sessionId) {
            try {
                // Calculate duration
                const duration = Math.floor((Date.now() - startTime) / 1000);

                // Build transcript and chat_history from messages
                const transcript = messages.map(m =>
                    `${m.role === 'user' ? 'You' : 'Marcus Sterling'}: ${m.content}`
                ).join('\n');

                const chatHistory = messages.map(m => ({
                    role: (m.role === 'user' ? 'human' : 'ai') as 'human' | 'ai',
                    content: m.content,
                    timestamp: Math.floor(Date.now() / 1000)
                }));

                // Update session with final data
                await updateSession(sessionId, {
                    transcript,
                    duration,
                    chat_history: chatHistory,
                    summary: `Session completed with ${messages.length} messages`
                });

                // Mark session as completed
                const completedSession = await completeSession(sessionId);

                // Navigate to transcript view if onComplete provided
                if (completedSession && onComplete) {
                    onComplete(completedSession);
                    return;
                }
            } catch (error) {
                console.error('[InteractivePitchSession] Failed to complete session:', error);
            }
        }

        // Fallback to onEndSession
        onEndSession();
    };

    const sidebarUser = {
        name: user?.fullName || 'User',
        email: user?.primaryEmailAddress?.emailAddress || '',
        avatar: user?.imageUrl || '',
    };

    const orbColors: [string, string] = ['#FFA500', '#FF9500'];
    const agentState = getAgentState();

    // Helper to get emotion color indicator
    const getEmotionDisplay = (emotionData: any) => {
        if (!emotionData) return null;

        const { dominant_emotion } = emotionData;

        switch (dominant_emotion) {
            case 'joy':
            case 'enthusiasm':
                return { label: 'Enthusiastic', dotColor: 'bg-green-400', textColor: 'text-green-400' };
            case 'confidence':
                return { label: 'Confident', dotColor: 'bg-blue-400', textColor: 'text-blue-400' };
            case 'nervousness':
            case 'fear':
                return { label: 'Nervous', dotColor: 'bg-yellow-400', textColor: 'text-yellow-400' };
            case 'surprise':
                return { label: 'Surprised', dotColor: 'bg-purple-400', textColor: 'text-purple-400' };
            case 'anger':
                return { label: 'Frustrated', dotColor: 'bg-red-400', textColor: 'text-red-400' };
            case 'sadness':
                return { label: 'Uncertain', dotColor: 'bg-indigo-400', textColor: 'text-indigo-400' };
            case 'neutral':
                return { label: 'Neutral', dotColor: 'bg-gray-400', textColor: 'text-gray-400' };
            default:
                return { label: dominant_emotion || 'Unknown', dotColor: 'bg-gray-400', textColor: 'text-gray-400' };
        }
    };

    const emotionDisplay = getEmotionDisplay(currentEmotion);

    return (
        <SidebarProvider>
            <div className="relative w-full h-screen bg-[#171717] flex">
                <AppSidebar user={sidebarUser} onNewSession={resetConversation} />

                <SidebarInset className="flex-1 flex flex-col items-center justify-center relative bg-[#171717]">
                    {/* Timer */}
                    <div className="absolute top-[60px] left-1/2 transform -translate-x-1/2">
                        <div className="px-6 py-2 rounded-full bg-white text-[#171717] font-medium text-[18px] shadow-lg">
                            {formatTime(elapsedTime)}
                        </div>
                    </div>

                    {/* Emotion Badge - Below Timer */}
                    {emotionDisplay && (
                        <div className="absolute top-[110px] left-1/2 transform -translate-x-1/2">
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-2">
                                <span className={cn("w-2 h-2 rounded-full", emotionDisplay.dotColor)} />
                                <span className={cn("text-xs font-medium capitalize", emotionDisplay.textColor)}>
                                    {emotionDisplay.label}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="absolute top-[170px] left-1/2 transform -translate-x-1/2">
                            <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                {error}
                            </div>
                        </div>
                    )}

                    {/* Main Orb */}
                    <div className="flex flex-col items-center justify-center gap-8">
                        <div className="w-[250px] h-[250px] flex items-center justify-center relative">
                            <Orb
                                colors={orbColors}
                                agentState={agentState}
                                getInputVolume={() => isUserSpeaking ? 0.6 + Math.random() * 0.3 : 0}
                                getOutputVolume={() => isAISpeaking ? 0.5 + Math.random() * 0.4 : 0}
                                className="w-full h-full"
                            />
                        </div>

                        {/* Status */}
                        <p className="text-[20px] font-medium text-[#f0f0f0]">
                            {getStatusMessage()}
                        </p>

                        {/* State Indicators */}
                        {isConnected && (
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "px-4 py-2 rounded-lg border transition-all duration-300",
                                    agentState === null
                                        ? "bg-[#262626] border-[#404040] text-[#f0f0f0]"
                                        : "bg-transparent border-[#2e2e2e] text-[#666666]"
                                )}>
                                    <span className="text-sm font-medium">Idle</span>
                                </div>
                                <div className={cn(
                                    "px-4 py-2 rounded-lg border transition-all duration-300",
                                    agentState === 'listening'
                                        ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                                        : "bg-transparent border-[#2e2e2e] text-[#666666]"
                                )}>
                                    <span className="text-sm font-medium">Listening</span>
                                </div>
                                <div className={cn(
                                    "px-4 py-2 rounded-lg border transition-all duration-300",
                                    agentState === 'talking'
                                        ? "bg-[#FF6B00]/20 border-[#FF6B00]/50 text-[#FF6B00]"
                                        : "bg-transparent border-[#2e2e2e] text-[#666666]"
                                )}>
                                    <span className="text-sm font-medium">Talking</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Transcript Panel */}
                    {showTranscript && (
                        <div className="absolute right-6 top-[140px] bottom-[140px] w-[350px] bg-[#1e1e1e] border border-[#333] rounded-xl overflow-hidden flex flex-col">
                            <div className="px-4 py-3 border-b border-[#333] flex items-center justify-between">
                                <span className="text-white font-medium">Conversation</span>
                                <button onClick={() => setShowTranscript(false)} className="text-gray-400 hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {messages.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center">Start speaking to see the conversation</p>
                                ) : (
                                    messages.map((msg, idx) => (
                                        <div key={idx} className={cn(
                                            "p-3 rounded-lg text-sm",
                                            msg.role === 'user'
                                                ? "bg-blue-500/20 text-blue-100 ml-8"
                                                : "bg-[#FF6B00]/20 text-orange-100 mr-8"
                                        )}>
                                            <div className="font-medium text-xs mb-1 opacity-70">
                                                {msg.role === 'user' ? 'You' : 'Marcus'}
                                            </div>
                                            {msg.content}
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Text Input */}
                            <form onSubmit={handleTextSubmit} className="p-3 border-t border-[#333]">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        placeholder="Or type a message..."
                                        disabled={isProcessing || isAISpeaking}
                                        className="flex-1 px-3 py-2 bg-[#262626] border border-[#404040] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FF6B00]"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!textInput.trim() || isProcessing || isAISpeaking}
                                        className="px-3 py-2 bg-[#FF6B00] hover:bg-[#ff7f1a] disabled:bg-[#333] disabled:text-gray-500 rounded-lg transition-colors"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Bottom Controls */}
                    <div className="absolute bottom-[60px] left-0 right-0 flex items-center justify-center px-8">
                        <div className="w-full max-w-[1000px] flex items-center justify-between">
                            {/* Left */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handlePauseToggle}
                                    disabled={!isConnected}
                                    className={cn(
                                        "h-12 px-6 rounded-lg flex items-center gap-2.5 font-medium border transition-all",
                                        isPaused
                                            ? "bg-[#FF6B00] hover:bg-[#ff7f1a] text-white border-[#FF6B00]"
                                            : "bg-[#262626] hover:bg-[#2e2e2e] text-[#f0f0f0] border-[#404040]"
                                    )}
                                >
                                    {isPaused ? <Play className="w-4 h-4" fill="currentColor" /> : <Pause className="w-4 h-4" fill="currentColor" />}
                                    <span className="text-[15px]">{isPaused ? 'Resume' : 'Pause'}</span>
                                </button>

                                <button
                                    onClick={handleMicToggle}
                                    disabled={!isConnected || isPaused || isAISpeaking}
                                    className={cn(
                                        "h-14 w-14 rounded-full flex items-center justify-center border-2 transition-all",
                                        isRecording
                                            ? isUserSpeaking
                                                ? "bg-green-500 border-green-400 animate-pulse"
                                                : "bg-red-500 border-red-400"
                                            : "bg-[#262626] border-[#404040]"
                                    )}
                                >
                                    {isRecording
                                        ? <MicOff className="w-6 h-6 text-white" />
                                        : <Mic className="w-6 h-6 text-[#f0f0f0]" />}
                                </button>
                            </div>

                            {/* Right */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setShowTranscript(!showTranscript)}
                                    className={cn(
                                        "h-12 w-12 rounded-lg flex items-center justify-center border transition-all",
                                        showTranscript
                                            ? "bg-[#FF6B00]/20 border-[#FF6B00]/50 text-[#FF6B00]"
                                            : "bg-[#262626] hover:bg-[#2e2e2e] text-[#f0f0f0] border-[#404040]"
                                    )}
                                >
                                    <MessageSquare className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={handleEndSession}
                                    className="h-12 px-6 rounded-lg flex items-center gap-2.5 font-medium bg-red-600/90 hover:bg-red-600 text-white border border-red-600 shadow-lg shadow-red-600/20"
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
    );
}
