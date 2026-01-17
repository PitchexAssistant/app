"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseAudioRecorderResult {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
  audioURL: string | null;
  audioLevels: number[];
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>([20, 25, 30, 25, 35, 30, 25, 28, 22]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Audio level monitoring
  const updateAudioLevels = useCallback(() => {
    if (!analyzerRef.current || !isRecording) {
      // Reset to base heights when not recording
      setAudioLevels([20, 25, 30, 25, 35, 30, 25, 28, 22]);
      return;
    }

    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
    analyzerRef.current.getByteFrequencyData(dataArray);

    // Get 9 frequency bands for real-time visualization
    const newLevels: number[] = [];
    const bandSize = Math.floor(dataArray.length / 9);

    for (let i = 0; i < 9; i++) {
      const start = i * bandSize;
      const end = start + bandSize;
      const bandData = dataArray.slice(start, end);
      const average = bandData.reduce((a, b) => a + b, 0) / bandData.length;

      // Map to design range: 20px to 60px
      const normalized = average / 255;
      const amplified = average < 5 ? 0 : Math.pow(normalized, 0.8);
      const height = 20 + (amplified * 40); // Range: 20-60px

      newLevels.push(height);
    }

    // Smooth interpolation for natural movement
    setAudioLevels(prevLevels =>
      prevLevels.map((prev, i) => {
        const target = newLevels[i];
        return prev + (target - prev) * 0.4;
      })
    );

    animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop recording if still active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Stop media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Close audio context and nullify ref to prevent double-closing
      try {
        const ctx = audioContextRef.current;
        if (ctx && ctx.state !== 'closed') {
          audioContextRef.current = null;
          ctx.close();
        }
      } catch (err) {
        // Ignore errors when closing AudioContext during unmount
        console.warn('AudioContext cleanup warning:', err);
      }

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      streamRef.current = stream;

      // Set up audio analysis for waveform
      audioContextRef.current = new AudioContext();
      analyzerRef.current = audioContextRef.current.createAnalyser();

      // Optimized settings for real-time visualization
      analyzerRef.current.fftSize = 512;
      analyzerRef.current.smoothingTimeConstant = 0.7;
      analyzerRef.current.minDecibels = -90;
      analyzerRef.current.maxDecibels = -10;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyzerRef.current);

      // Start audio level monitoring
      updateAudioLevels();

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Cleanup audio context
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        // Safely close audio context
        try {
          const ctx = audioContextRef.current;
          if (ctx && ctx.state !== 'closed') {
            audioContextRef.current = null;
            ctx.close();
          }
        } catch (err) {
          // Ignore errors when closing AudioContext during cleanup
          console.warn('AudioContext close warning:', err);
        }

        // Reset audio levels to static
        setAudioLevels([20, 20, 20, 20, 20, 20, 20, 20, 20]);
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(errorMessage);
      console.error('Error starting recording:', err);
    }
  }, [updateAudioLevels]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);

      // Pause timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  }, [isRecording, isPaused]);

  const resetRecording = useCallback(() => {
    stopRecording();
    setRecordingTime(0);
    setAudioBlob(null);

    if (audioURL) {
      URL.revokeObjectURL(audioURL);
      setAudioURL(null);
    }

    audioChunksRef.current = [];
    setError(null);
  }, [stopRecording, audioURL]);

  return {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioURL,
    audioLevels,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    error,
  };
}
