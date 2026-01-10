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
    emotion?: any;
}

interface UseInteractivePitchOptions {
    sessionId?: string;
    onTranscription?: (text: string) => void;
    onResponse?: (text: string) => void;
    onError?: (error: string) => void;
    onEmotion?: (emotion: any) => void;
}

export function useInteractivePitch(options: UseInteractivePitchOptions = {}) {
    const { sessionId = `session_${Date.now()}` } = options;

    // Store callbacks in refs to avoid dependency chain issues
    const callbacksRef = useRef(options);
    callbacksRef.current = options;

    // State
    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [isAISpeaking, setIsAISpeaking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [currentEmotion, setCurrentEmotion] = useState<any>(null);

    // Refs
    const wsRef = useRef<WebSocket | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const playbackContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const isPlayingRef = useRef(false);
    const isMountedRef = useRef(true);
    const ttsAudioBufferRef = useRef<ArrayBuffer[]>([]);  // Buffer for TTS audio chunks

    // VAD state
    const vadActiveRef = useRef(false);
    const silenceStartRef = useRef<number | null>(null);
    const audioChunksRef = useRef<Float32Array[]>([]);

    // Constants
    const VAD_THRESHOLD = 0.01;
    const SILENCE_DURATION = 600;
    const SAMPLE_RATE = 16000;

    // Helper: Float32 to WAV
    const float32ToWav = useCallback((samples: Float32Array, sampleRate: number): ArrayBuffer => {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);

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

        let offset = 44;
        for (let i = 0; i < samples.length; i++) {
            const s = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            offset += 2;
        }

        return buffer;
    }, []);

    // Helper: Play Audio
    const playAudio = useCallback(async (audioData: ArrayBuffer) => {
        try {
            if (!playbackContextRef.current || playbackContextRef.current.state === 'closed') {
                playbackContextRef.current = new AudioContext({ sampleRate: 44100 });
            }

            if (playbackContextRef.current.state === 'suspended') {
                await playbackContextRef.current.resume();
            }

            const audioBuffer = await playbackContextRef.current.decodeAudioData(audioData);
            const source = playbackContextRef.current.createBufferSource();

            source.buffer = audioBuffer;
            source.connect(playbackContextRef.current.destination);

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

    // Handle WebSocket messages - NO external callback dependencies
    const handleMessage = useCallback((event: MessageEvent) => {
        if (event.data instanceof Blob) {
            // Buffer audio chunks instead of playing immediately
            event.data.arrayBuffer().then(buffer => {
                console.log('[Audio] Received chunk:', buffer.byteLength, 'bytes');
                ttsAudioBufferRef.current.push(buffer);
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
                        callbacksRef.current.onTranscription?.(data.text);
                        setIsProcessing(true);
                        break;

                    case 'emotion':
                        console.log('[WS] Emotion:', data.data);
                        setCurrentEmotion(data.data);
                        callbacksRef.current.onEmotion?.(data.data);
                        break;

                    case 'response':
                        setMessages(prev => [...prev, {
                            role: 'assistant',
                            content: data.text,
                            timestamp: new Date()
                        }]);
                        callbacksRef.current.onResponse?.(data.text);
                        setIsProcessing(false);
                        break;

                    case 'speaking_start':
                        setIsAISpeaking(true);
                        // Clear audio buffer for new speech
                        ttsAudioBufferRef.current = [];
                        break;

                    case 'speaking_end':
                        // Combine all buffered audio chunks and play
                        if (ttsAudioBufferRef.current.length > 0) {
                            const totalLength = ttsAudioBufferRef.current.reduce((sum, buf) => sum + buf.byteLength, 0);
                            const combined = new Uint8Array(totalLength);
                            let offset = 0;
                            for (const chunk of ttsAudioBufferRef.current) {
                                combined.set(new Uint8Array(chunk), offset);
                                offset += chunk.byteLength;
                            }
                            console.log('[Audio] Playing combined audio:', combined.byteLength, 'bytes');
                            playAudio(combined.buffer);
                            ttsAudioBufferRef.current = [];
                        }
                        setIsAISpeaking(false);
                        break;

                    case 'no_speech':
                        setIsProcessing(false);
                        break;

                    case 'error':
                        setError(data.message);
                        setIsProcessing(false);
                        callbacksRef.current.onError?.(data.message);
                        break;

                    case 'pong':
                        break;
                }
            } catch (e) {
                console.error('[WS] Parse error:', e);
            }
        }
    }, [playAudio]); // Only depends on playAudio which is stable

    // Send audio to server
    const sendAudioToServer = useCallback(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (audioChunksRef.current.length === 0) return;

        console.log('[Audio] Sending', audioChunksRef.current.length, 'chunks to server');
        setIsProcessing(true);
        setIsUserSpeaking(false);

        const totalLength = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
        const combined = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of audioChunksRef.current) {
            combined.set(chunk, offset);
            offset += chunk.length;
        }

        let maxAbs = 0;
        for (let i = 0; i < combined.length; i++) {
            maxAbs = Math.max(maxAbs, Math.abs(combined[i]));
        }

        const targetLevel = 0.8;
        const gain = maxAbs > 0 ? Math.min((targetLevel / maxAbs), 3.0) : 1.0;

        const normalized = new Float32Array(combined.length);
        for (let i = 0; i < combined.length; i++) {
            normalized[i] = Math.max(-1, Math.min(1, combined[i] * gain));
        }

        const wavBuffer = float32ToWav(normalized, SAMPLE_RATE);
        const uint8Array = new Uint8Array(wavBuffer);

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

        audioChunksRef.current = [];
    }, [float32ToWav]);

    // Process audio for VAD
    const processAudio = useCallback((inputBuffer: AudioBuffer) => {
        const channelData = inputBuffer.getChannelData(0);

        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
            sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);

        const now = Date.now();

        if (rms > VAD_THRESHOLD) {
            if (!vadActiveRef.current) {
                console.log('[VAD] Voice started');
                vadActiveRef.current = true;
                setIsUserSpeaking(true);
            }
            silenceStartRef.current = null;
            audioChunksRef.current.push(new Float32Array(channelData));
        } else if (vadActiveRef.current) {
            audioChunksRef.current.push(new Float32Array(channelData));

            if (silenceStartRef.current === null) {
                silenceStartRef.current = now;
            } else if (now - silenceStartRef.current >= SILENCE_DURATION) {
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

            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
            }
            const source = audioContextRef.current.createMediaStreamSource(stream);

            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 512;
            source.connect(analyserRef.current);

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
            callbacksRef.current.onError?.(e.message);
        }
    }, [isRecording, processAudio]);

    // Stop recording
    const stopRecording = useCallback(() => {
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
    }, []);

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

                // Only retry on abnormal close when still mounted
                if (isMountedRef.current && e.code !== 1000) {
                    setTimeout(() => {
                        if (isMountedRef.current) connect();
                    }, 2000);
                }
            };
        } catch (e: any) {
            console.error('[WS] Failed to create:', e);
            setError('Failed to connect');
        }
    }, [sessionId, handleMessage]);

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

        if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') {
            playbackContextRef.current.close().catch(console.error);
        }

        setIsConnected(false);
    }, [stopRecording]);

    // Auto-connect on mount - ONLY depends on sessionId, not callbacks
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
    }, [sessionId]); // Only reconnect when sessionId changes

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
        currentEmotion
    };
}
