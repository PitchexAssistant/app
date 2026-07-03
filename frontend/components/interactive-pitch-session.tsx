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
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useUser } from '@clerk/nextjs';
import { useSessions } from '@/hooks/use-sessions';
import { Session } from '@/lib/api/client';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Reusable class constants
const CLASSES = {
    // Layout
    centerAbsolute: 'absolute left-1/2 transform -translate-x-1/2',
    flexCenter: 'flex items-center justify-center',
    // State badges
    stateBadgeBase: 'px-4 py-2 rounded-lg border transition-all duration-300 text-sm font-medium',
    stateBadgeActive: 'bg-surface-2 border-surface-3 text-text-primary',
    stateBadgeInactive: 'bg-transparent border-border-gray text-text-tertiary',
    stateBadgeListening: 'bg-blue/10 border-blue/30 text-blue',
    stateBadgeTalking: 'bg-accent-lime/10 border-accent-lime/30 text-accent-lime',
    // Messages
    messageBase: 'p-3 rounded-lg text-sm',
    messageUser: 'bg-surface-2 text-text-primary ml-8',
    messageAI: 'text-text-primary mr-8',
    // Panel
    panelCard: 'bg-surface-1 border border-border-gray rounded-xl overflow-hidden',
    panelHeader: 'px-4 py-3 border-b border-border-gray flex items-center justify-between',
    // Input
    textInput: 'flex-1 px-3 py-2 bg-surface-2 border border-border-gray rounded-lg text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:border-surface-3',
} as const;

interface InteractivePitchSessionProps {
    sessionId?: string;
    onEndSession: () => void;
    onComplete?: (session: Session) => void;
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
    const containerRef = useRef<HTMLDivElement>(null);

    // Gradient animation - reveals from top
    useGSAP(() => {
        gsap.fromTo(".session-gradient",
            { y: "-100%", opacity: 0.8 },
            { y: "-40%", duration: 5, ease: "power2.out", delay: 0.5 }
        );
    }, { scope: containerRef });

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

    // Save chat_history to backend whenever messages change
    useEffect(() => {
        if (!sessionId || messages.length === 0) return;
        const chatHistory = messages.map(m => ({
            role: (m.role === 'user' ? 'human' : 'ai') as 'human' | 'ai',
            content: m.content,
            timestamp: Math.floor(Date.now() / 1000)
        }));
        updateSession(sessionId, { chat_history: chatHistory }).catch(err => {
            console.error('[InteractivePitchSession] Failed to save chat_history:', err);
        });
    }, [messages, sessionId, updateSession]);

    // Auto-start recording when connected
    const hasAutoStarted = useRef(false);
    useEffect(() => {
        if (isConnected && !isRecording && !isPaused && !hasAutoStarted.current) {
            hasAutoStarted.current = true;
            const timer = setTimeout(() => startRecording(), 200);
            return () => clearTimeout(timer);
        }
        if (!isConnected) hasAutoStarted.current = false;
    }, [isConnected, isRecording, isPaused, startRecording]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const getAgentState = (): AgentState => {
        if (!isConnected) return 'thinking';
        if (isPaused) return null;
        if (isAISpeaking) return 'talking';
        if (isUserSpeaking) return 'listening';
        if (isProcessing) return 'thinking';
        return null;
    };

    const getStatusMessage = (): string => {
        if (!isConnected) return 'Connecting...';
        if (isPaused) return 'Paused';
        if (isAISpeaking) return 'Marcus is speaking...';
        if (isUserSpeaking) return 'Listening...';
        if (isProcessing) return 'Thinking...';
        return 'Idle';
    };

    const handlePauseToggle = () => {
        if (isPaused) startRecording();
        else stopRecording();
        setIsPaused(!isPaused);
    };

    const handleMicToggle = () => {
        if (isRecording) stopRecording();
        else startRecording();
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

        if (sessionId) {
            try {
                const duration = Math.floor((Date.now() - startTime) / 1000);
                const transcript = messages.map(m =>
                    `${m.role === 'user' ? 'You' : 'Marcus Sterling'}: ${m.content}`
                ).join('\n');
                const chatHistory = messages.map(m => ({
                    role: (m.role === 'user' ? 'human' : 'ai') as 'human' | 'ai',
                    content: m.content,
                    timestamp: Math.floor(Date.now() / 1000)
                }));

                await updateSession(sessionId, {
                    transcript,
                    duration,
                    chat_history: chatHistory,
                    summary: `Session completed with ${messages.length} messages`
                });

                const completedSession = await completeSession(sessionId);
                if (completedSession && onComplete) {
                    onComplete(completedSession);
                    return;
                }
            } catch (error) {
                console.error('[InteractivePitchSession] Failed to complete session:', error);
            }
        }
        onEndSession();
    };

    const sidebarUser = {
        name: user?.fullName || 'User',
        email: user?.primaryEmailAddress?.emailAddress || '',
        avatar: user?.imageUrl || '',
    };

    const orbColors: [string, string] = ['#FBFF50', '#355592'];
    const agentState = getAgentState();

    // Emotion display helper
    const getEmotionDisplay = (emotionData: any) => {
        if (!emotionData) return null;
        const { dominant_emotion } = emotionData;
        const emotionMap: Record<string, { label: string; dotColor: string; textColor: string }> = {
            'joy': { label: 'Enthusiastic', dotColor: 'bg-green', textColor: 'text-green' },
            'enthusiasm': { label: 'Enthusiastic', dotColor: 'bg-magenta', textColor: 'text-magenta' },
            'confidence': { label: 'Confident', dotColor: 'bg-blue', textColor: 'text-blue' },
            'nervousness': { label: 'Nervous', dotColor: 'bg-yellow', textColor: 'text-yellow' },
            'fear': { label: 'Nervous', dotColor: 'bg-yellow', textColor: 'text-yellow' },
            'surprise': { label: 'Surprised', dotColor: 'bg-magenta', textColor: 'text-magenta' },
            'anger': { label: 'Frustrated', dotColor: 'bg-red', textColor: 'text-red' },
            'sadness': { label: 'Uncertain', dotColor: 'bg-purple', textColor: 'text-purple' },
            'neutral': { label: 'Neutral', dotColor: 'bg-text-primary', textColor: 'text-text-primary' },
        };
        return emotionMap[dominant_emotion] || { label: dominant_emotion || 'Unknown', dotColor: 'bg-text-tertiary', textColor: 'text-text-tertiary' };
    };

    const emotionDisplay = getEmotionDisplay(currentEmotion);

    // Get state badge class
    const getStateBadgeClass = (state: AgentState | null, targetState: AgentState | null) => {
        if (targetState === null) {
            return agentState === null ? CLASSES.stateBadgeActive : CLASSES.stateBadgeInactive;
        }
        if (targetState === 'listening') {
            return agentState === 'listening' ? CLASSES.stateBadgeListening : CLASSES.stateBadgeInactive;
        }
        if (targetState === 'talking') {
            return agentState === 'talking' ? CLASSES.stateBadgeTalking : CLASSES.stateBadgeInactive;
        }
        return CLASSES.stateBadgeInactive;
    };

    return (
        <SidebarProvider>
            <div ref={containerRef} className="relative w-full h-screen bg-surface-0 flex overflow-hidden">
                <AppSidebar user={sidebarUser} onNewSession={resetConversation} />

                <SidebarInset className="flex-1 flex flex-col items-center justify-center relative bg-surface-0 overflow-hidden">
                    {/* Gradient Background Layer */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        {/* Left Globe */}
                        <div
                            className="session-gradient absolute -bottom-[40%] -left-[45%] w-[100vw] h-[100vw] rounded-full blur-[120px] opacity-90"
                            style={{
                                background: `
                                    radial-gradient(circle at center, 
                                        rgba(64, 83, 214, 0.85) 0%, 
                                        rgba(45, 140, 255, 0.55) 25%, 
                                        rgba(88, 28, 135, 0.35) 50%, 
                                        rgba(128, 0, 255, 0.25) 75%, 
                                        transparent 100%
                                    )
                                `,
                                transform: "translateY(100%)"
                            }}
                        />
                        {/* Right Globe */}
                        <div
                            className="session-gradient absolute -bottom-[40%] -right-[45%] w-[100vw] h-[100vw] rounded-full blur-[120px] opacity-90"
                            style={{
                                background: `
                                    radial-gradient(circle at center, 
                                        rgba(64, 83, 214, 0.85) 0%, 
                                        rgba(45, 140, 255, 0.55) 25%, 
                                        rgba(88, 28, 135, 0.35) 50%, 
                                        rgba(128, 0, 255, 0.25) 75%,
                                        transparent 100%
                                    )
                                `,
                                transform: "translateY(100%)"
                            }}
                        />
                    </div>

                    {/* Timer */}
                    <div className={cn(CLASSES.centerAbsolute, 'top-16 z-10')}>
                        <div className="px-4 py-2 rounded-md bg-accent-lime text-surface-0 font-medium text-h4 shadow-lg">
                            {formatTime(elapsedTime)}
                        </div>
                    </div>

                    {/* Emotion Badge */}
                    {emotionDisplay && (
                        <div className={cn(CLASSES.centerAbsolute, 'top-30')}>
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-2">
                                <span className={cn("size-2 rounded-full", emotionDisplay.dotColor)} />
                                <span className={cn("text-caption font-medium capitalize", emotionDisplay.textColor)}>
                                    {emotionDisplay.label}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className={cn(CLASSES.centerAbsolute, 'top-44')}>
                            <div className="px-4 py-2 rounded-lg bg-red/10 border border-red/30 text-red text-sm">
                                {error}
                            </div>
                        </div>
                    )}

                    {/* Main Orb */}
                    <div className="flex flex-col items-center justify-center gap-8">
                        <div className="size-64 flex items-center justify-center relative">
                            <Orb
                                colors={orbColors}
                                agentState={agentState}
                                getInputVolume={() => isUserSpeaking ? 0.6 + Math.random() * 0.3 : 0}
                                getOutputVolume={() => isAISpeaking ? 0.5 + Math.random() * 0.4 : 0}
                                className="w-full h-full"
                            />
                        </div>

                        {/* Status */}
                        <p className="text-h4 font-medium text-text-primary">
                            {getStatusMessage()}
                        </p>

                        {/* State Indicators */}
                        {isConnected && (
                            <div className="flex items-center gap-3">
                                <div className={cn(CLASSES.stateBadgeBase, getStateBadgeClass(agentState, null))}>
                                    Idle
                                </div>
                                <div className={cn(CLASSES.stateBadgeBase, getStateBadgeClass(agentState, 'listening'))}>
                                    Listening
                                </div>
                                <div className={cn(CLASSES.stateBadgeBase, getStateBadgeClass(agentState, 'talking'))}>
                                    Talking
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Transcript Panel */}
                    {showTranscript && (
                        <div className={cn(CLASSES.panelCard, 'absolute right-6 top-15 bottom-0 w-80 h-[calc(100%-200px)] flex flex-col')}>
                            <div className={CLASSES.panelHeader}>
                                <span className="text-text-primary font-medium">Conversation</span>
                                <Button variant="ghost" size="sm" onClick={() => setShowTranscript(false)}>
                                    <X className="size-4" />
                                </Button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                {messages.length === 0 ? (
                                    <p className="text-text-tertiary text-sm text-center">
                                        Start speaking to see the conversation
                                    </p>
                                ) : (
                                    messages.map((msg, idx) => (
                                        <div key={idx} className={cn(
                                            CLASSES.messageBase,
                                            msg.role === 'user' ? CLASSES.messageUser : CLASSES.messageAI
                                        )}>
                                            <div className="font-medium text-caption mb-1 opacity-70">
                                                {msg.role === 'user' ? 'You' : 'Marcus'}
                                            </div>
                                            {msg.content}
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Text Input */}
                            <form onSubmit={handleTextSubmit} className="p-3 border-t border-border-gray">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        placeholder="Or type a message..."
                                        disabled={isProcessing || isAISpeaking}
                                        className={CLASSES.textInput}
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={!textInput.trim() || isProcessing || isAISpeaking}
                                    >
                                        <Send className="size-4" />
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Bottom Controls */}
                    <div className="absolute bottom-16 left-0 right-0 flex items-center justify-center px-8">
                        <div className="w-full max-w-4xl flex items-center justify-between">
                            {/* Left */}
                            <div className="flex items-center gap-4">
                                <Button
                                    onClick={handlePauseToggle}
                                    disabled={!isConnected}
                                    variant={isPaused ? "active" : "nav"}
                                >
                                    {isPaused ? <Play className="size-4" fill="currentColor" /> : <Pause className="size-4" fill="currentColor" />}
                                    {isPaused ? 'Resume' : 'Pause'}
                                </Button>

                                <Button
                                    onClick={handleMicToggle}
                                    disabled={!isConnected || isPaused || isAISpeaking}
                                    variant={isRecording ? "micRecording" : "mic"}
                                    size="icon"
                                >
                                    {isRecording
                                        ? <MicOff className="size-6" />
                                        : <Mic className="size-6" />}
                                </Button>
                            </div>

                            {/* Right */}
                            <div className="flex items-center gap-4">
                                <Button
                                    variant={showTranscript ? "active" : "nav"}
                                    size="icon"
                                    onClick={() => setShowTranscript(!showTranscript)}
                                >
                                    <MessageSquare className="size-5" />
                                </Button>

                                <Button onClick={handleEndSession} variant="destructive">
                                    <X className="size-4" />
                                    End Session
                                </Button>
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
