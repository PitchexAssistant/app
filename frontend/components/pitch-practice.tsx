"use client";

import { useState, useEffect } from 'react';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { useSessions } from '@/hooks/use-sessions';
import { InteractivePitchSession } from '@/components/interactive-pitch-session';
import { api, Session as APISession } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmotionIndicator, EmotionBreakdown } from '@/components/emotion-indicator';
import { LiveWaveform } from '@/components/ui/live-waveform';
import { Mic, Square, Loader2, Send, ArrowLeft, X, Radio, Upload, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  emotion?: any;
  timestamp: Date;
}

interface UploadedPreview {
  filename: string;
  local_url?: string;
  file_index?: number;
}

interface PitchPracticeProps {
  uploadedFiles: Array<{
    filename: string
    file_id: string
    file_index: number
    text_length: number
    local_url: string
  }>
  onDeleteFile?: (index: number) => void
  onBack?: () => void
  onComplete?: (session: any) => void  // Called when session is completed, receives completed session
  initialSession?: any // Existing session data for resumption
}

type PitchMode = 'select' | 'record' | 'live' | 'upload';

export function PitchPractice({ onBack, onComplete, uploadedFiles = [], onDeleteFile, initialSession }: PitchPracticeProps) {
  const { user } = useUser();
  const [pitchMode, setPitchMode] = useState<PitchMode>('select');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<any>(null);
  const [sessionId] = useState<string>(() => `session_${Date.now()}`);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [hoveredFileIndex, setHoveredFileIndex] = useState<number | null>(null);
  const [startTime] = useState<Date>(new Date());
  const [audioMode, setAudioMode] = useState<'none' | 'record' | 'upload'>('none');
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const [uploadedAudioURL, setUploadedAudioURL] = useState<string | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { createSession, updateSession, completeSession, currentSession, setCurrentSession } = useSessions();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(".session-gradient",
      { y: "-100%", opacity: 0.8 },
      { y: "-40%", duration: 5, ease: "power2.out", delay: 0.5 }
    );
  }, { scope: containerRef });

  // Set the session if passed from parent and load its data
  useEffect(() => {
    if (initialSession) {
      console.log('[PitchPractice] Loading existing session:', initialSession.id);
      setCurrentSession(initialSession);

      // Load session data if available
      if (initialSession.transcript) {
        // Parse transcript back into messages
        const lines = initialSession.transcript.split('\n');
        const loadedMessages: Message[] = lines
          .filter((line: string) => line.includes(':'))
          .map((line: string) => {
            const [role, ...contentParts] = line.split(':');
            return {
              role: role.trim().toLowerCase() as 'user' | 'assistant',
              content: contentParts.join(':').trim(),
              timestamp: new Date(initialSession.updated_at)
            };
          });
        setMessages(loadedMessages);
      }

      // Set the mode based on session - resume exactly where user left off
      const sessionMode = initialSession.mode as PitchMode;
      if (['record', 'live', 'upload'].includes(sessionMode)) {
        setPitchMode(sessionMode);
      } else {
        // If mode is 'select' or unknown, keep it as 'select' to show mode selector
        setPitchMode('select');
      }
    } else {
      // New session - show mode selector
      console.log('[PitchPractice] New session - showing mode selector');
      setPitchMode('select');
      setMessages([]);
    }
  }, [initialSession, setCurrentSession]);

  const {
    isRecording,
    recordingTime,
    audioBlob,
    startRecording,
    stopRecording,
    resetRecording,
    error: recordingError,
  } = useAudioRecorder();

  // Live session hook removed - using LiveSessionLiveKit component instead

  useEffect(() => {
    if (recordingError) {
      setError(recordingError);
    }
  }, [recordingError]);

  useEffect(() => {
    if (recordingError) {
      setError(recordingError);
    }
  }, [recordingError]);

  useEffect(() => {
    if (uploadedFiles.length === 0) {
      setSelectedFileIndex(0);
    } else if (selectedFileIndex >= uploadedFiles.length) {
      setSelectedFileIndex(0);
    }
  }, [uploadedFiles, selectedFileIndex]);

  useEffect(() => {
    return () => {
      try {
        uploadedFiles.forEach((f) => {
          if (f.local_url) {
            URL.revokeObjectURL(f.local_url);
          }
        });
      } catch (e) {
        // ignore cleanup errors
      }
    };
  }, [uploadedFiles]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Validate audio file
  const validateAudioFile = (file: File): boolean => {
    // Check file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav'];
    const validExtensions = /\.(mp3|wav)$/i;

    if (!validTypes.includes(file.type) && !file.name.match(validExtensions)) {
      setUploadError('Please upload only MP3 or WAV files');
      return false;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return false;
    }

    return true;
  };

  // Handle audio file selection
  const handleAudioFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (!validateAudioFile(file)) {
      return;
    }

    // Set upload mode and store file
    setAudioMode('upload');
    setUploadedAudioFile(file);
    setUploadedAudioURL(URL.createObjectURL(file));

    // Clear any existing recording
    if (audioBlob) {
      resetRecording();
    }
  };

  // Handle removing audio (upload or recording)
  const handleRemoveAudio = () => {
    if (audioMode === 'upload') {
      if (uploadedAudioURL) {
        URL.revokeObjectURL(uploadedAudioURL);
      }
      setUploadedAudioFile(null);
      setUploadedAudioURL(null);
      setUploadError(null);
    } else if (audioMode === 'record') {
      resetRecording();
    }
    setAudioMode('none');
    setError(null);
  };

  // Handle proceed with uploaded audio
  const handleProceedWithUpload = async () => {
    if (!uploadedAudioFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Process uploaded audio through STT pipeline
      const result = await api.pipeline.processAudio(
        uploadedAudioFile,
        sessionId,
        messages.map(m => ({ role: m.role, content: m.content }))
      );

      // Add user message
      const userMessage: Message = {
        role: 'user',
        content: result.transcript,
        emotion: result.emotion,
        timestamp: new Date(),
      };

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage, assistantMessage]);
      setCurrentEmotion(result.emotion);

      // Save chat_history to trigger title generation (especially on first message)
      if (currentSession) {
        const updatedMessages = [...messages, userMessage, assistantMessage];
        const chatHistory = updatedMessages.map(m => ({
          role: (m.role === 'user' ? 'human' : 'ai') as 'human' | 'ai',
          content: m.content,
          timestamp: m.timestamp ? Math.floor(m.timestamp.getTime() / 1000) : undefined
        }));

        // Update session with chat_history - this triggers auto-title on first message
        updateSession(currentSession.id, { chat_history: chatHistory }).catch(err => {
          console.error('Failed to update chat_history:', err);
        });
      }

      // Clear uploaded audio after processing
      handleRemoveAudio();
    } catch (err: any) {
      console.error('Failed to process uploaded audio:', err);
      setError(err.message || 'Failed to process audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEndSession = async () => {
    try {
      // Stop any active recording first to prevent AudioContext errors
      if (isRecording || audioBlob) {
        resetRecording();
        // Wait a bit for the MediaRecorder.onstop handler to complete
        // This prevents race condition with component unmount
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Calculate duration
      const duration = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

      // Update session with final data including chat_history for title generation
      if (currentSession && user?.id) {
        const transcript = messages.map(m => `${m.role}: ${m.content}`).join('\n');
        const summaryText = `Session completed with ${messages.length} messages`;

        // Convert messages to chat_history format for backend title generation
        const chatHistory = messages.map(m => ({
          role: (m.role === 'user' ? 'human' : 'ai') as 'human' | 'ai',
          content: m.content,
          timestamp: m.timestamp ? Math.floor(m.timestamp.getTime() / 1000) : undefined
        }));

        await updateSession(currentSession.id, {
          transcript: transcript || undefined,
          summary: summaryText || undefined,
          duration: duration > 0 ? duration : undefined,
          chat_history: chatHistory.length > 0 ? chatHistory : undefined,
        });

        const completedSession = await completeSession(currentSession.id);

        // Navigate to transcript view if onComplete provided
        if (completedSession && onComplete) {
          onComplete(completedSession);
          return; // Don't call onBack if navigating to transcript
        }
      }
    } catch (error) {
      console.error('Error saving session:', error);
      // Continue with cleanup even if save fails
    }

    // End live session if active
    // LiveKit session handling is managed within the component

    // Go back to dashboard (fallback if no onComplete)
    onBack?.();
  };

  const handleStartRecording = async () => {
    setError(null);
    setAudioMode('record');

    // Clear any uploaded audio
    if (uploadedAudioFile) {
      if (uploadedAudioURL) {
        URL.revokeObjectURL(uploadedAudioURL);
      }
      setUploadedAudioFile(null);
      setUploadedAudioURL(null);
    }

    await startRecording();
  };

  const handleStopRecording = async () => {
    stopRecording();
  };

  const handleSendRecording = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await api.pipeline.processAudio(
        audioBlob,
        sessionId,
        messages.map(m => ({
          role: m.role,
          content: m.content,
        }))
      );

      const newMessages = [
        ...messages,
        {
          role: 'user' as const,
          content: result.transcript,
          emotion: result.emotion,
          timestamp: new Date(),
        },
        {
          role: 'assistant' as const,
          content: result.response,
          timestamp: new Date(),
        },
      ];

      setMessages(newMessages);
      setCurrentEmotion(result.emotion);

      // Auto-save session with new messages and chat_history for title generation
      if (currentSession && user?.id) {
        const transcript = newMessages.map(m => `${m.role}: ${m.content}`).join('\n');
        const chatHistory = newMessages.map(m => ({
          role: (m.role === 'user' ? 'human' : 'ai') as 'human' | 'ai',
          content: m.content,
          timestamp: m.timestamp ? Math.floor(m.timestamp.getTime() / 1000) : undefined
        }));
        await updateSession(currentSession.id, {
          transcript,
          analysis: result.emotion,
          chat_history: chatHistory,
        }).catch(err => console.error('Failed to auto-save session:', err));
      }

      resetRecording();
    } catch (err: any) {
      console.error('Processing error:', err);
      let errorMessage = 'Failed to process audio. Please try again.';

      // Provide more specific error messages
      if (err.message?.includes('Decoding failed') || err.message?.includes('ffmpeg')) {
        errorMessage = 'Unable to process the recorded audio. Please try recording again.';
      } else if (err.message?.includes('No speech detected')) {
        errorMessage = 'No speech detected. Please speak more clearly and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessUploadedAudio = async () => {
    if (!uploadedAudioFile) return;

    setIsUploadingAudio(true);
    setUploadError(null);

    try {
      const result = await api.pipeline.processAudio(
        uploadedAudioFile,
        sessionId,
        messages.map(m => ({
          role: m.role,
          content: m.content,
        }))
      );

      const newMessages = [
        ...messages,
        {
          role: 'user' as const,
          content: result.transcript,
          emotion: result.emotion,
          timestamp: new Date(),
        },
        {
          role: 'assistant' as const,
          content: result.response,
          timestamp: new Date(),
        },
      ];

      setMessages(newMessages);
      setCurrentEmotion(result.emotion);

      // Auto-save session with new messages and chat_history for title generation
      if (currentSession && user?.id) {
        const transcript = newMessages.map(m => `${m.role}: ${m.content}`).join('\n');
        const chatHistory = newMessages.map(m => ({
          role: (m.role === 'user' ? 'human' : 'ai') as 'human' | 'ai',
          content: m.content,
          timestamp: m.timestamp ? Math.floor(m.timestamp.getTime() / 1000) : undefined
        }));
        await updateSession(currentSession.id, {
          transcript,
          analysis: result.emotion,
          chat_history: chatHistory,
        }).catch(err => console.error('Failed to auto-save session:', err));
      }

      // Reset upload state
      setUploadedAudioFile(null);
    } catch (err: any) {
      console.error('Upload processing error:', err);
      let errorMessage = 'Failed to process audio file. Please try again.';

      // Provide more specific error messages
      if (err.message?.includes('Decoding failed') || err.message?.includes('ffmpeg')) {
        errorMessage = 'Unable to process this audio file. Please ensure it\'s a valid MP3 or WAV file and try again.';
      } else if (err.message?.includes('No speech detected')) {
        errorMessage = 'No speech detected in the audio. Please upload a file with clear speech.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setUploadError(errorMessage);
    } finally {
      setIsUploadingAudio(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-[calc(100vh-64px)] bg-surface-0 flex items-center justify-center overflow-hidden">
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

      <div className="relative z-10 w-full max-w-2xl px-6">

        {/* Document Preview - Show for all modes except select */}
        {pitchMode !== 'select' && uploadedFiles && uploadedFiles.length > 0 && (
          <div className="mb-6 flex gap-2 justify-center">
            {uploadedFiles.map((f, i) => (
              <div key={i} className="px-3 py-1 bg-surface-1/50 backdrop-blur-md rounded-full border border-surface-3 text-xs text-text-secondary flex items-center gap-2">
                <span>{f.filename}</span>
                <button onClick={() => onDeleteFile?.(i)} className="hover:text-text-primary"><X className="size-3" /></button>
              </div>
            ))}
          </div>
        )}

        {/* Record Mode - Now supports both recording and uploading */}
        {pitchMode === 'record' || pitchMode === 'select' ? (
          <div className="bg-surface-1/80 backdrop-blur-xl border border-border-gray rounded-3xl p-8 shadow-2xl">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-text-primary mb-2">Analysis & Feedback</h2>
              <div className="p-4 bg-surface-2/50 rounded-xl border border-surface-3">
                <p className="text-text-secondary text-sm">
                  Join a live AI investor call that reacts, questions, and scores your performance
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Show errors */}
              {(error || uploadError) && (
                <div className="p-3 bg-red/10 border border-red/20 rounded-lg text-red text-sm text-center">
                  {error || uploadError}
                </div>
              )}

              {/* Initial State - Show both record and upload options */}
              {audioMode === 'none' && !isRecording && (
                <div className="space-y-8">
                  {/* Divider */}
                  <div className="relative h-px bg-surface-3"></div>

                  <p className="text-center text-text-secondary text-sm">
                    Press to record or upload
                  </p>

                  <div className="flex items-center gap-3">
                    <Button
                      size="lg"
                      onClick={handleStartRecording}
                      disabled={isProcessing}
                      className="flex-1 bg-[#F5F5F7] hover:bg-[#E1E1E3] text-black h-12 rounded-xl text-base font-medium shadow-none border-0"
                    >
                      <Mic className="h-5 w-5 mr-2" />
                      Record
                    </Button>
                    <Button
                      size="lg"
                      className="h-12 w-14 rounded-xl bg-[#FF4F18] hover:bg-[#E04515] text-white shadow-none border-0 p-0 flex items-center justify-center"
                      onClick={() => document.getElementById('audio-upload-input')?.click()}
                      disabled={isProcessing}
                    >
                      <Upload className="h-5 w-5" />
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl bg-surface-2 border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-3"
                    onClick={onBack}
                  >
                    Cancel Session
                  </Button>

                  <input
                    id="audio-upload-input"
                    type="file"
                    accept=".mp3,.wav,audio/mpeg,audio/wav,audio/wave,audio/x-wav"
                    onChange={handleAudioFileSelect}
                    className="hidden"
                  />
                </div>
              )}

              {/* Recording State */}
              {audioMode === 'record' && isRecording && (
                <div className="space-y-8 py-4">
                  <div className="text-center space-y-4">
                    <LiveWaveform
                      active={isRecording}
                      barColor="#FBFF50"
                      height={60}
                      barWidth={6}
                      barGap={10}
                    />
                    <p className="text-4xl font-mono font-bold text-text-primary">
                      {formatTime(recordingTime)}
                    </p>
                    <p className="text-sm text-text-secondary">Recording...</p>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={handleStopRecording}
                      className="h-20 w-20 rounded-full animate-pulse flex items-center justify-center p-0"
                    >
                      <Square className="h-8 w-8 fill-current" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Audio Ready State (Recorded or Uploaded) */}
              {audioMode !== 'none' && !isRecording && (audioBlob || uploadedAudioFile) && (
                <div className="space-y-6">
                  <div className="bg-surface-0 rounded-xl p-4 border border-surface-3">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-accent-lime/10 flex items-center justify-center text-accent-lime">
                          {audioMode === 'record' ? <Mic className="size-5" /> : <Upload className="size-5" />}
                        </div>
                        <div>
                          <p className="text-text-primary font-medium text-sm">
                            {audioMode === 'record' ? 'Recorded Session' : uploadedAudioFile?.name}
                          </p>
                          <p className="text-text-tertiary text-xs">
                            {audioMode === 'record' ? formatTime(recordingTime) : 'Ready to analyze'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveAudio}
                        className="p-2 rounded-full hover:bg-surface-2 text-text-tertiary hover:text-red transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    </div>

                    <audio
                      src={audioMode === 'record' && audioBlob
                        ? URL.createObjectURL(audioBlob)
                        : uploadedAudioURL || undefined
                      }
                      controls
                      className="w-full h-8"
                    />
                  </div>

                  <Button
                    size="lg"
                    onClick={audioMode === 'record' ? handleSendRecording : handleProceedWithUpload}
                    disabled={isProcessing}
                    className="w-full h-12 text-base rounded-xl gap-2 bg-accent-lime hover:bg-accent-lime/90 text-surface-0 font-semibold"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Analyzing Pitch...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Generate Analysis
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : null}


        {/* Live Session Mode - Interactive Pitch Coaching */}
        {pitchMode === 'live' && (
          <div className="fixed inset-0 z-50 bg-surface-0">
            <InteractivePitchSession
              sessionId={currentSession?.id || sessionId}
              onEndSession={handleEndSession}
              onComplete={onComplete}
              contextFiles={uploadedFiles}
            />
          </div>
        )}

        {/* Upload Mode UI logic is handled above in the consolidated card */}
      </div>
    </div>
  );
}
