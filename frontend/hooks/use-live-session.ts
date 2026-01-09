/**
 * Custom hook for managing Gemini Live pitch coaching sessions
 * Handles WebSocket connection, audio streaming, and real-time communication
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMicVAD } from "@ricky0123/vad-react";

export type SessionMode = 'pitch' | 'qa' | 'negotiation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SessionSummary {
  session_id: string;
  status: string;
  message_count: number;
  mode: string;
}

interface UseLiveSessionOptions {
  sessionId: string;
  mode?: SessionMode;
  context?: string;
  onError?: (error: string) => void;
  onMessage?: (message: Message) => void;
}

interface UseLiveSessionReturn {
  isConnected: boolean;
  isConnecting: boolean;
  isRecording: boolean;
  isUserSpeaking: boolean;
  isAISpeaking: boolean;
  messages: Message[];
  currentMode: SessionMode;
  summary: SessionSummary | null;
  error: string | null;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  startRecording: () => void;
  stopRecording: () => void;
  sendText: (text: string) => void;
  changeMode: (mode: SessionMode) => void;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export function useLiveSession({
  sessionId,
  mode = 'pitch',
  context,
  onError,
  onMessage,
}: UseLiveSessionOptions): UseLiveSessionReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMode, setCurrentMode] = useState<SessionMode>(mode);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const aiSpeakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // VAD Hook
  const vad = useMicVAD({
    startOnLoad: false,
    baseAssetPath: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.30/dist/",
    onnxWASMBasePath: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/",
    onFrameProcessed: (probabilities, frame) => {
      if (!isConnected || !isRecording) return;

      // Only send audio if speech probability is high
      if (probabilities.isSpeech > 0.5) {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          try {
            // Convert Float32 (VAD output) to Int16 PCM (Backend expectation)
            const pcmData = float32ToInt16(frame);
            wsRef.current.send(pcmData.buffer);
          } catch (err) {
            console.error('[useLiveSession] Error sending audio chunk:', err);
          }
        }
      }
    },
  });

  // Helper to convert Float32 to Int16 PCM
  const float32ToInt16 = (float32Array: Float32Array): Int16Array => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  };

  // WebSocket connection
  const startSession = useCallback(async () => {
    if (isConnected || isConnecting) return;

    try {
      setIsConnecting(true);
      const contextParam = context ? `&context=${encodeURIComponent(context)}` : '';
      const wsUrl = `${WS_URL}/api/v1/ws/live/${sessionId}?mode=${mode}${contextParam}`;

      console.log('[useLiveSession] Connecting to:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (!isConnected && ws.readyState !== WebSocket.OPEN) {
          console.error('[useLiveSession] Connection timeout - closing WebSocket');
          ws.close();
          setIsConnecting(false);
          setError('Connection timeout. Please check if backend is running.');
          if (onError) onError('Connection timeout');
        }
      }, 10000); // 10 second timeout

      ws.onopen = () => {
        console.log('[useLiveSession] WebSocket connected successfully');
        clearTimeout(connectionTimeout);
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
      };

      ws.onmessage = async (event) => {
        if (event.data instanceof Blob) {
          // Audio data from AI - set AI speaking state
          setIsAISpeaking(true);
          await playAudioChunk(event.data);

          // Clear previous timeout and set new one
          if (aiSpeakingTimeoutRef.current) {
            clearTimeout(aiSpeakingTimeoutRef.current);
          }
          // AI stops speaking 500ms after last audio chunk
          aiSpeakingTimeoutRef.current = setTimeout(() => {
            setIsAISpeaking(false);
          }, 500);
        } else {
          // JSON message
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'connection':
              console.log('Session connected:', data.message);
              if (data.message) {
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: data.message,
                  timestamp: new Date()
                }]);
              }
              break;

            case 'assistant_message':
              const assistantMsg: Message = {
                role: 'assistant',
                content: data.content,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, assistantMsg]);
              if (onMessage) onMessage(assistantMsg);
              break;

            case 'user_message':
              const userMsg: Message = {
                role: 'user',
                content: data.content,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, userMsg]);
              break;

            case 'mode_changed':
              setCurrentMode(data.mode);
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.message,
                timestamp: new Date()
              }]);
              break;

            case 'session_ended':
              setSummary(data.summary);
              break;

            case 'error':
              const errorMsg = data.message || 'An error occurred';
              setError(errorMsg);
              if (onError) onError(errorMsg);
              break;

            case 'pong':
              // Heartbeat response
              break;
          }
        }
      };

      ws.onerror = (event) => {
        console.error('[useLiveSession] WebSocket error:', event);
        // Attempt to extract more info if available
        if (event instanceof ErrorEvent) {
          console.error('[useLiveSession] Error details:', event.message);
        }
        setError('Connection error occurred');
        setIsConnecting(false);
        if (onError) onError('Connection error occurred');
      };

      ws.onclose = (event) => {
        console.log('[useLiveSession] WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        setIsAISpeaking(false);
        // Ensure VAD is stopped
        vad.pause();
        setIsRecording(false);
      };

    } catch (err: any) {
      const errorMsg = err.message || 'Failed to start session';
      console.error('[useLiveSession] Session start error:', err);
      setError(errorMsg);
      setIsConnected(false);
      setIsConnecting(false);
      if (onError) onError(errorMsg);
    }
  }, [sessionId, mode, context, onError, onMessage, vad]);

  // End session
  const endSession = useCallback(async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'end_session'
      }));

      // Wait a bit for summary, then close
      setTimeout(() => {
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
        setIsConnected(false);
        vad.pause();
        setIsRecording(false);
      }, 2000);
    }
  }, [vad]);

  // Audio recording control via VAD
  const startRecording = useCallback(() => {
    console.log('[useLiveSession] Starting VAD recording...');
    vad.start();
    setIsRecording(true);
  }, [vad]);

  const stopRecording = useCallback(() => {
    console.log('[useLiveSession] Stopping VAD recording...');
    vad.pause();
    setIsRecording(false);
  }, [vad]);

  // Send text message
  const sendText = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'text',
        data: text
      }));
    }
  }, []);

  // Change mode
  const changeMode = useCallback((newMode: SessionMode) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'mode_change',
        data: newMode
      }));
    }
  }, []);

  // Play audio chunk - supports MP3 (Edge TTS) and PCM (Gemini native)
  const audioQueueRef = useRef<Blob[]>([]);
  const isPlayingRef = useRef<boolean>(false);

  const playNextInQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isPlayingRef.current = true;
    const blob = audioQueueRef.current.shift();

    if (!blob) {
      isPlayingRef.current = false;
      return;
    }

    try {
      // Check if it's MP3 format (Edge TTS output)
      const isMP3 = blob.type === 'audio/mpeg' || blob.size > 1000;

      if (isMP3) {
        // Use HTML5 Audio for MP3 - more reliable for encoded audio
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        audio.onended = () => {
          URL.revokeObjectURL(url);
          isPlayingRef.current = false;
          // Play next in queue
          playNextInQueue();
        };

        audio.onerror = (e) => {
          console.error('[useLiveSession] MP3 playback error:', e);
          URL.revokeObjectURL(url);
          isPlayingRef.current = false;
          // Try next in queue
          playNextInQueue();
        };

        await audio.play();
      } else {
        // Use AudioContext for PCM (raw audio from Gemini)
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        }

        const arrayBuffer = await blob.arrayBuffer();

        try {
          const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current.destination);

          source.onended = () => {
            isPlayingRef.current = false;
            playNextInQueue();
          };

          source.start();
        } catch (decodeError) {
          console.error('[useLiveSession] PCM decode error, trying as raw:', decodeError);
          isPlayingRef.current = false;
          playNextInQueue();
        }
      }
    } catch (err) {
      console.error('[useLiveSession] Error playing audio:', err);
      isPlayingRef.current = false;
      playNextInQueue();
    }
  }, []);

  const playAudioChunk = useCallback((blob: Blob) => {
    // Add to queue and start playing if not already
    audioQueueRef.current.push(blob);
    playNextInQueue();
  }, [playNextInQueue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      // Don't pause VAD here as it might be used by other components or cause issues if paused too early
      // vad.pause(); 

      // Clear audio queue
      audioQueueRef.current = [];
      isPlayingRef.current = false;

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (e) {
          console.error('[useLiveSession] Error closing AudioContext:', e);
        }
        audioContextRef.current = null;
      }
    };
  }, []); // Remove vad from dependencies to prevent unnecessary re-runs

  return {
    isConnected,
    isConnecting,
    isRecording,
    isUserSpeaking: vad.userSpeaking,
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
  };
}
