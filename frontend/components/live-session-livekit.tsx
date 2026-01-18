

import {
    LiveKitRoom,
    RoomAudioRenderer,
    StartAudio,
    useVoiceAssistant,
    useConnectionState,
    useRoomContext,
} from "@livekit/components-react";
import { ConnectionState, RoomEvent } from "livekit-client";
import { useCallback, useEffect, useState, useRef } from "react";
import "@livekit/components-styles";
import { Orb, AgentState } from '@/components/ui/orb';
import { Pause, Play, Mic, MicOff, HelpCircle, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useUser } from '@clerk/nextjs';

interface LiveSessionLiveKitProps {
    sessionId?: string;
    onEndSession: () => void;
    contextFiles?: any[];
}

export function LiveSessionLiveKit({ sessionId = "default-room", onEndSession, contextFiles = [] }: LiveSessionLiveKitProps) {
    const [token, setToken] = useState<string>("");
    const [url, setUrl] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Fetch token from backend
        // Note: We need to implement an endpoint to generate LiveKit tokens
        const fetchToken = async () => {
            try {
                const response = await fetch(`/api/v1/live/token?room=${sessionId}&username=user-${Math.random().toString(36).substring(7)}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch token: ${response.statusText}`);
                }
                const data = await response.json();
                setToken(data.token);
                setUrl(data.url);
            } catch (e: any) {
                console.error("Failed to fetch token", e);
                setError(e.message || "Failed to connect to session");
            }
        };
        fetchToken();
    }, [sessionId]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-surface-0 text-text-primary gap-4">
                <div className="text-red text-lg font-medium">Connection Error</div>
                <div className="text-text-secondary">{error}</div>
                <Button
                    onClick={onEndSession}
                    variant="destructive"
                >
                    Close
                </Button>
            </div>
        );
    }

    if (!token || !url) {
        return (
            <div className="flex items-center justify-center h-full bg-surface-0 text-text-primary">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-lime"></div>
                <span className="ml-3">Initializing session...</span>
            </div>
        );
    }

    return (
        <LiveKitRoom
            token={token}
            serverUrl={url}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={onEndSession}
            onError={(e) => {
                console.error("LiveKit Room Error:", e);
                setError("Connection failed. Please try again.");
            }}
            className="h-full w-full bg-surface-0"
        >
            <LiveKitOrbInterface
                onEndSession={onEndSession}
                contextFiles={contextFiles}
            />
            <RoomAudioRenderer />
            <StartAudio label="Click to allow audio playback" />
        </LiveKitRoom>
    );
}

interface LiveKitOrbInterfaceProps {
    onEndSession: () => void;
    contextFiles?: any[];
}

function LiveKitOrbInterface({ onEndSession, contextFiles }: LiveKitOrbInterfaceProps) {
    const { state, audioTrack } = useVoiceAssistant();
    const connectionState = useConnectionState();
    const room = useRoomContext();
    const { user } = useUser();

    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [startTime, setStartTime] = useState<number | null>(null);

    // Volume refs for orb reactivity
    const inputVolumeRef = useRef<number>(0);
    const outputVolumeRef = useRef<number>(0);

    const isConnected = connectionState === ConnectionState.Connected;

    // Timer logic
    useEffect(() => {
        if (isConnected && !startTime) {
            setStartTime(Date.now());
        } else if (!isConnected) {
            setStartTime(null);
            setElapsedTime(0);
        }
    }, [isConnected, startTime]);

    useEffect(() => {
        if (!startTime || !isConnected) return;
        const interval = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime, isConnected]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Map LiveKit state to Orb AgentState
    const getAgentState = (): AgentState => {
        if (!isConnected) return 'thinking';
        if (isPaused) return null;

        switch (state) {
            case 'speaking': return 'talking';
            case 'listening': return 'listening';
            case 'thinking': return 'thinking';
            default: return null;
        }
    };

    const agentState = getAgentState();

    // Volume simulation (since we don't have raw audio analysis easily accessible yet)
    // In a real implementation, we'd attach an analyzer to the audio tracks
    const getInputVolume = () => {
        if (state === 'listening' && !isMuted && !isPaused) {
            const baseVolume = 0.4;
            const variation = Math.random() * 0.5;
            inputVolumeRef.current = baseVolume + variation;
            return inputVolumeRef.current;
        }
        return 0;
    };

    const getOutputVolume = () => {
        if (state === 'speaking' && !isPaused) {
            const baseVolume = 0.5;
            const variation = Math.random() * 0.4;
            outputVolumeRef.current = baseVolume + variation;
            return outputVolumeRef.current;
        }
        return 0;
    };

    const handlePause = () => {
        const newPausedState = !isPaused;
        setIsPaused(newPausedState);
        // In a real app, we might want to mute/unmute local tracks here
        if (newPausedState) {
            room.localParticipant.setMicrophoneEnabled(false);
        } else if (!isMuted) {
            room.localParticipant.setMicrophoneEnabled(true);
        }
    };

    const handleMute = () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
        room.localParticipant.setMicrophoneEnabled(!newMutedState);
    };

    const sidebarUser = {
        name: user?.fullName || 'User',
        email: user?.primaryEmailAddress?.emailAddress || '',
        avatar: user?.imageUrl || '',
    };

    const orbColors: [string, string] = ['#FBFF50', '#355592'];
    const contextFileName = contextFiles && contextFiles.length > 0 ? contextFiles[0].filename : undefined;

    // Status message mapping
    const getStatusMessage = () => {
        if (!isConnected) return 'Connecting...';
        if (isPaused) return 'Session Paused';
        switch (state) {
            case 'speaking': return 'Talking';
            case 'listening': return 'Listening';
            case 'thinking': return 'Thinking';
            default: return 'Idle';
        }
    };

    return (
        <SidebarProvider>
            <div className="relative w-full h-screen bg-surface-0 flex">
                <AppSidebar
                    user={sidebarUser}
                    onNewSession={() => console.log('New session requested')}
                />

                <SidebarInset className="flex-1 flex flex-col items-center justify-center relative bg-surface-0">
                    {/* Timer */}
                    <div className="absolute top-[60px] left-1/2 transform -translate-x-1/2">
                        <div className="px-6 py-2 rounded-full bg-text-primary text-surface-0 font-medium text-[18px] shadow-lg">
                            {formatTime(elapsedTime)}
                        </div>
                    </div>

                    {/* Context Badge */}
                    {isConnected && contextFileName && (
                        <div className="absolute top-[130px] left-1/2 transform -translate-x-1/2 flex items-center gap-3">
                            <div className="px-4 py-2 rounded-lg bg-surface-2 border border-surface-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-text-tertiary" />
                                <span className="text-sm text-text-primary">Context: {contextFileName}</span>
                            </div>
                        </div>
                    )}

                    {/* Main Orb Area */}
                    <div className="flex flex-col items-center justify-center gap-12">
                        <div className="w-[250px] h-[250px] flex items-center justify-center">
                            <div className="w-full h-full opacity-90">
                                <Orb
                                    colors={orbColors}
                                    agentState={agentState}
                                    getInputVolume={getInputVolume}
                                    getOutputVolume={getOutputVolume}
                                    className="w-full h-full"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-6">
                            <p className="text-[20px] font-medium text-text-primary">
                                {getStatusMessage()}
                            </p>

                            {isConnected && (
                                <div className="flex items-center gap-3">
                                    <div className={cn("px-4 py-2 rounded-lg border transition-all", agentState === null ? "bg-surface-2 border-surface-3 text-text-primary" : "bg-transparent border-surface-3 text-text-tertiary")}>
                                        <span className="text-sm font-medium">Idle</span>
                                    </div>
                                    <div className={cn("px-4 py-2 rounded-lg border transition-all", agentState === 'listening' ? "bg-blue/10 border-blue/30 text-blue" : "bg-transparent border-surface-3 text-text-tertiary")}>
                                        <span className="text-sm font-medium">Listening</span>
                                    </div>
                                    <div className={cn("px-4 py-2 rounded-lg border transition-all", agentState === 'talking' ? "bg-accent-lime/10 border-accent-lime/30 text-accent-lime" : "bg-transparent border-surface-3 text-text-tertiary")}>
                                        <span className="text-sm font-medium">Talking</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="absolute bottom-[60px] left-0 right-0 flex items-center justify-center px-8">
                        <div className="w-full max-w-[1000px] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button
                                    onClick={handlePause}
                                    disabled={!isConnected}
                                    variant={isPaused ? "default" : "nav"}
                                    className={cn(
                                        "gap-2.5",
                                        !isConnected && "opacity-40 cursor-not-allowed"
                                    )}
                                >
                                    <div className="w-5 h-5 flex items-center justify-center">
                                        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                                    </div>
                                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                                </Button>

                                <button
                                    onClick={handleMute}
                                    disabled={!isConnected}
                                    className={cn(
                                        "h-11 w-11 rounded-lg flex items-center justify-center transition-all border",
                                        !isConnected && "opacity-40 cursor-not-allowed",
                                        isMuted ? "bg-red/10 text-red border-red/30" : "bg-surface-2 text-text-primary border-surface-3"
                                    )}
                                >
                                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                </button>
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    variant="nav"
                                    size="icon"
                                    disabled={!isConnected}
                                    className={cn(!isConnected && "opacity-40 cursor-not-allowed")}
                                >
                                    <HelpCircle className="w-5 h-5" />
                                </Button>

                                <Button
                                    onClick={onEndSession}
                                    variant="destructive"
                                    className="gap-2.5"
                                >
                                    <X className="w-4 h-4" />
                                    <span>End Session</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}

