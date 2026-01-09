"use client";

/**
 * Interactive Pitch Session Hook
 * Implements natural voice conversation flow like Gemini Live:
 * 1. Auto-detect voice → Listening state
 * 2. Silence detection → Send to server → Processing state
 * 3. Show transcription → LLM response → Talking state
 * 4. Return to Idle
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface UseInteractivePitchOptions {
    sessionId?: string;
    onTranscription?: (text: string) => void;
    onResponse?: (text: string) => void;
    onError?: (error: string) => void;
}

export function useInteractivePitch(options: UseInteractivePitchOptions = {}) {
    const {
        sessionId = `session_${Date.now()}`,
        onTranscription,
        onResponse,
        onError,
    } = options;

    // State
    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [isAISpeaking, setIsAISpeaking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Refs
    const wsRef = useRef<WebSocket | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const audioQueueRef = useRef<AudioBuffer[]>([]);
    const isPlayingRef = useRef(false);
    const isMountedRef = useRef(true);

    // VAD state
    const vadActiveRef = useRef(false);
    const silenceStartRef = useRef<number | null>(null);
    const audioChunksRef = useRef<Float32Array[]>([]);

    // Constants
    const VAD_THRESHOLD = 0.01;
    const SILENCE_DURATION = 1200; // 1.2 seconds of silence before processing
    const SAMPLE_RATE = 16000;

    // Convert Float32 samples to WAV
    const float32ToWav = (samples: Float32Array, sampleRate: number): ArrayBuffer => {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);

        // WAV header
        const writeString = (offset: number, str: string) => {
            for (let i = 0; i < str.length; i++) {
                view.setUint8(offset + i, str.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samples.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, samples.length * 2, true);

        // Convert samples
        let offset = 44;
        for (let i = 0; i < samples.length; i++) {
            const s = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            offset += 2;
        }

        return buffer;
    };

    // Play audio response
    const playAudio = useCallback(async (audioData: ArrayBuffer) => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext({ sampleRate: 44100 });
            }

            const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);

            source.onended = () => {
                isPlayingRef.current = false;
                setIsAISpeaking(false);
            };

            isPlayingRef.current = true;
            setIsAISpeaking(true);
            source.start(0);
        } catch (e) {
            console.error('[Audio] Playback error:', e);
            isPlayingRef.current = false;
            setIsAISpeaking(false);
        }
    }, []);

    // Handle WebSocket messages
    const handleMessage = useCallback((event: MessageEvent) => {
        if (event.data instanceof Blob) {
            // Audio response from TTS
            event.data.arrayBuffer().then(buffer => {
                playAudio(buffer);
            });
        } else {
            try {
                const data = JSON.parse(event.data);
                console.log('[WS] Received:', data.type);

                switch (data.type) {
                    case 'connected':
                        console.log('[WS] Session ready');
                        break;

                    case 'transcription':
                        setMessages(prev => [...prev, {
                            role: 'user',
                            content: data.text,
                            timestamp: new Date()
                        }]);
                        onTranscription?.(data.text);
                        setIsProcessing(true);
                        break;

                    case 'response':
                        setMessages(prev => [...prev, {
                            role: 'assistant',
                            content: data.text,
                            timestamp: new Date()
                        }]);
                        onResponse?.(data.text);
                        setIsProcessing(false);
                        break;

                    case 'speaking_start':
                        setIsAISpeaking(true);
                        break;

                    case 'speaking_end':
                        setIsAISpeaking(false);
                        break;

                    case 'no_speech':
                        setIsProcessing(false);
                        break;

                    case 'error':
                        setError(data.message);
                        setIsProcessing(false);
                        onError?.(data.message);
                        break;

                    case 'pong':
                        break;
                }
            } catch (e) {
                console.error('[WS] Parse error:', e);
            }
        }
    }, [onTranscription, onResponse, onError, playAudio]);

    // Send audio to server
    const sendAudioToServer = useCallback(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (audioChunksRef.current.length === 0) return;

        console.log('[Audio] Sending', audioChunksRef.current.length, 'chunks to server');
        setIsProcessing(true);
        setIsUserSpeaking(false);

        // Combine all chunks
        const totalLength = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
        const combined = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of audioChunksRef.current) {
            combined.set(chunk, offset);
            offset += chunk.length;
        }

        // Normalize and amplify audio for better STT recognition
        let maxAbs = 0;
        for (let i = 0; i < combined.length; i++) {
            maxAbs = Math.max(maxAbs, Math.abs(combined[i]));
        }

        // Apply gain (normalize to 80% + 2x boost for quiet audio)
        const targetLevel = 0.8;
        const gain = maxAbs > 0 ? Math.min((targetLevel / maxAbs), 3.0) : 1.0;
        console.log('[Audio] Gain applied:', gain.toFixed(2), 'maxAbs:', maxAbs.toFixed(4));

        const normalized = new Float32Array(combined.length);
        for (let i = 0; i < combined.length; i++) {
            normalized[i] = Math.max(-1, Math.min(1, combined[i] * gain));
        }

        // Convert to WAV
        const wavBuffer = float32ToWav(normalized, SAMPLE_RATE);
        const uint8Array = new Uint8Array(wavBuffer);

        // Convert to base64 in chunks to avoid stack overflow
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
            binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        const base64 = btoa(binary);

        console.log('[Audio] Sending WAV, size:', uint8Array.length, 'bytes');

        wsRef.current.send(JSON.stringify({
            type: 'audio_data',
            data: base64,
            format: 'wav',
            sampleRate: SAMPLE_RATE
        }));

        // Clear chunks
        audioChunksRef.current = [];
    }, []);

    // Process audio for VAD
    const processAudio = useCallback((inputBuffer: AudioBuffer) => {
        const channelData = inputBuffer.getChannelData(0);

        // Calculate RMS volume
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
            sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);

        const now = Date.now();

        if (rms > VAD_THRESHOLD) {
            // Voice detected
            if (!vadActiveRef.current) {
                console.log('[VAD] Voice started');
                vadActiveRef.current = true;
                setIsUserSpeaking(true);
            }
            silenceStartRef.current = null;

            // Store audio chunk
            audioChunksRef.current.push(new Float32Array(channelData));
        } else if (vadActiveRef.current) {
            // Silence after voice
            audioChunksRef.current.push(new Float32Array(channelData));

            if (silenceStartRef.current === null) {
                silenceStartRef.current = now;
            } else if (now - silenceStartRef.current >= SILENCE_DURATION) {
                // Enough silence - send audio
                console.log('[VAD] Silence detected, sending audio');
                vadActiveRef.current = false;
                silenceStartRef.current = null;
                sendAudioToServer();
            }
        }
    }, [sendAudioToServer]);

    // Start recording with VAD
    const startRecording = useCallback(async () => {
        if (isRecording) return;
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.log('[Recording] WebSocket not ready');
            return;
        }

        try {
            console.log('[Recording] Requesting microphone...');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: SAMPLE_RATE,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });

            streamRef.current = stream;

            // Create audio context
            audioContextRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
            const source = audioContextRef.current.createMediaStreamSource(stream);

            // Create analyser
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 512;
            source.connect(analyserRef.current);

            // Create script processor for capturing audio
            const bufferSize = 4096;
            processorRef.current = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);

            processorRef.current.onaudioprocess = (e) => {
                if (!isMountedRef.current) return;
                processAudio(e.inputBuffer);
            };

            source.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);

            setIsRecording(true);
            console.log('[Recording] Started with VAD');

        } catch (e: any) {
            console.error('[Recording] Failed:', e);
            setError(e.message || 'Failed to access microphone');
            onError?.(e.message);
        }
    }, [isRecording, processAudio, onError]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (!isRecording) return;

        console.log('[Recording] Stopping...');

        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        vadActiveRef.current = false;
        silenceStartRef.current = null;
        audioChunksRef.current = [];

        setIsRecording(false);
        setIsUserSpeaking(false);
    }, [isRecording]);

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;
        if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

        const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/api/v1/ws/pitch/${sessionId}`;
        console.log('[WS] Connecting to:', wsUrl);

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('[WS] Connected');
                setIsConnected(true);
                setError(null);
            };

            ws.onmessage = handleMessage;

            ws.onerror = (e) => {
                console.error('[WS] Error:', e);
            };

            ws.onclose = (e) => {
                console.log('[WS] Closed:', e.code, e.reason);
                setIsConnected(false);
                wsRef.current = null;

                // Retry connection after a delay
                if (isMountedRef.current && e.code !== 1000) {
                    setTimeout(() => connect(), 2000);
                }
            };
        } catch (e: any) {
            console.error('[WS] Failed to create:', e);
            setError('Failed to connect');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    // Send text message
    const sendText = useCallback((text: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (!text.trim()) return;

        wsRef.current.send(JSON.stringify({
            type: 'text',
            content: text.trim()
        }));

        setIsProcessing(true);
    }, []);

    // Reset conversation
    const resetConversation = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'reset' }));
        }
        setMessages([]);
    }, []);

    // Disconnect
    const disconnect = useCallback(() => {
        stopRecording();
        if (wsRef.current) {
            wsRef.current.close(1000);
            wsRef.current = null;
        }

        // Stop audio playback immediately
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }

        setIsConnected(false);
    }, [stopRecording]);

    // Auto-connect on mount
    useEffect(() => {
        isMountedRef.current = true;

        const timeout = setTimeout(() => {
            if (isMountedRef.current) {
                connect();
            }
        }, 100);

        const pingInterval = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);

        return () => {
            isMountedRef.current = false;
            clearTimeout(timeout);
            clearInterval(pingInterval);
            stopRecording();
            if (wsRef.current) {
                wsRef.current.close(1000);
                wsRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    return {
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
        connect,
        disconnect,
    };
}
