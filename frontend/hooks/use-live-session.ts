/**
 * Custom hook for managing Gemini Live pitch coaching sessions
 * Handles WebSocket connection, audio streaming, and real-time communication
 */

import { useEffect, useRef, useState, useCallback } from 'react';

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
  isRecording: boolean;
  messages: Message[];
  currentMode: SessionMode;
  summary: SessionSummary | null;
  error: string | null;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  startRecording: () => Promise<void>;
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
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMode, setCurrentMode] = useState<SessionMode>(mode);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioChunksRef = useRef<Uint8Array[]>([]);

  // WebSocket connection
  const startSession = useCallback(async () => {
    try {
      const contextParam = context ? `&context=${encodeURIComponent(context)}` : '';
      const wsUrl = `${WS_URL}/api/v1/ws/live/${sessionId}?mode=${mode}${contextParam}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = async (event) => {
        if (event.data instanceof Blob) {
          // Audio data from AI
          await playAudioChunk(event.data);
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
        console.error('WebSocket error:', event);
        setError('Connection error occurred');
        if (onError) onError('Connection error occurred');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };

    } catch (err: any) {
      const errorMsg = err.message || 'Failed to start session';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    }
  }, [sessionId, mode, context, onError, onMessage]);

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
      }, 2000);
    }
  }, []);

  // Audio recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          // Convert to PCM and send
          const arrayBuffer = await event.data.arrayBuffer();
          const audioData = new Uint8Array(arrayBuffer);
          
          // Send as binary
          wsRef.current.send(audioData);
        }
      };

      mediaRecorder.start(100); // Send chunks every 100ms
      setIsRecording(true);
      setError(null);

    } catch (err: any) {
      const errorMsg = err.message || 'Failed to access microphone';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    }
  }, [onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      // Stop all tracks
      const stream = mediaRecorderRef.current.stream;
      stream.getTracks().forEach(track => track.stop());
      
      setIsRecording(false);
    }
  }, []);

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

  // Play audio chunk
  const playAudioChunk = async (blob: Blob) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (err) {
      console.error('Error playing audio:', err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    isRecording,
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
