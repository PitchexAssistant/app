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
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="text-text-primary hover:bg-surface-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                {currentSession?.title || 'AI Pitch Practice'}
              </h1>
              <p className="text-text-secondary mt-1">
                {pitchMode === 'live'
                  ? 'Live pitch coaching with Marcus Sterling AI'
                  : 'Practice your pitch with real-time emotion analysis and AI feedback'}
              </p>
            </div>
          </div>
        </div>



        {/* Document Preview - Show for all modes except select */}
        {pitchMode !== 'select' && uploadedFiles && uploadedFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
              <CardDescription>Preview the documents you uploaded for this session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {uploadedFiles.map((f, i) => (
                    <div
                      key={i}
                      className="relative"
                      onMouseEnter={() => setHoveredFileIndex(i)}
                      onMouseLeave={() => setHoveredFileIndex(null)}
                    >
                      <button
                        onClick={() => setSelectedFileIndex(i)}
                        className={`px-3 py-2 pr-8 rounded-lg border ${i === selectedFileIndex ? 'border-accent-lime/30 bg-accent-lime/10' : 'border-surface-3'} text-sm text-text-primary transition-all`}
                      >
                        {f.filename}
                      </button>
                      {hoveredFileIndex === i && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDeleteFile) {
                              onDeleteFile(i);
                            }
                          }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-red/80 hover:bg-red transition-colors"
                          title="Delete file"
                        >
                          <X className="h-3 w-3 text-text-primary" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="w-full h-96 bg-surface-1/80 rounded-md overflow-hidden">
                  {uploadedFiles[selectedFileIndex]?.local_url ? (
                    <iframe
                      title={uploadedFiles[selectedFileIndex].filename}
                      src={uploadedFiles[selectedFileIndex].local_url}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-text-tertiary">
                      No preview available
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-6">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

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



        {/* Record Mode - Now supports both recording and uploading */}
        {pitchMode === 'record' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Analysis & Feedback</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleRemoveAudio();
                      setPitchMode('select');
                    }}
                  >
                    Change Mode
                  </Button>
                </CardTitle>
                <CardDescription>
                  Record your pitch or upload an audio file for AI analysis and coaching feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Show errors */}
                {(error || uploadError) && (
                  <div className="p-3 bg-red/10 border border-red/20 rounded-lg text-red text-sm">
                    {error || uploadError}
                  </div>
                )}

                {/* Initial State - Show both record and upload options */}
                {audioMode === 'none' && !isRecording && (
                  <div className="space-y-4">
                    <p className="text-center text-text-secondary">
                      Press to record or upload
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        size="lg"
                        onClick={handleStartRecording}
                        disabled={isProcessing}
                        className="gap-2"
                      >
                        <Mic className="h-5 w-5" />
                        Record
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => document.getElementById('audio-upload-input')?.click()}
                        disabled={isProcessing}
                        className="gap-2"
                      >
                        <Upload className="h-5 w-5" />
                        Upload Audio
                      </Button>
                    </div>
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
                  <div className="space-y-4">
                    <div className="text-center space-y-4">
                      <LiveWaveform
                        active={isRecording}
                        barColor="#FBFF50"
                        height={60}
                        barWidth={6}
                        barGap={10}
                      />
                      <p className="text-2xl font-mono font-bold text-primary">
                        {formatTime(recordingTime)}
                      </p>
                      <p className="text-sm text-text-secondary">Recording...</p>
                    </div>
                    <div className="flex justify-center">
                      <Button
                        size="lg"
                        variant="destructive"
                        onClick={handleStopRecording}
                        className="h-16 w-16 rounded-full animate-pulse"
                      >
                        <Square className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Audio Ready State (Recorded or Uploaded) */}
                {audioMode !== 'none' && !isRecording && (audioBlob || uploadedAudioFile) && (
                  <div className="space-y-4">
                    <div className="text-center space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-sm text-text-secondary">
                          {audioMode === 'record'
                            ? `Recording ready • ${formatTime(recordingTime)}`
                            : `Audio uploaded: ${uploadedAudioFile?.name}`
                          }
                        </p>
                        <button
                          onClick={handleRemoveAudio}
                          className="p-1.5 rounded-full bg-red/80 hover:bg-red transition-colors"
                          title="Remove audio"
                        >
                          <X className="h-3.5 w-3.5 text-text-primary" />
                        </button>
                      </div>
                      <audio
                        src={audioMode === 'record' && audioBlob
                          ? URL.createObjectURL(audioBlob)
                          : uploadedAudioURL || undefined
                        }
                        controls
                        className="mx-auto w-full max-w-md"
                      />
                    </div>

                    {/* Proceed and End Session buttons */}
                    <div className="flex gap-3 justify-center pt-2">
                      <Button
                        size="lg"
                        onClick={audioMode === 'record' ? handleSendRecording : handleProceedWithUpload}
                        disabled={isProcessing}
                        className="gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Proceed
                          </>
                        )}
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={handleEndSession}
                        disabled={isProcessing}
                      >
                        End Session
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {currentEmotion && (
              <Card>
                <CardHeader>
                  <CardTitle>Latest Emotion Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <EmotionIndicator emotion={currentEmotion} />
                  <EmotionBreakdown emotion={currentEmotion} />

                  {currentEmotion.metrics && (
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-text-secondary">Nervousness</p>
                        <p className="text-lg font-semibold">
                          {Math.round(currentEmotion.metrics.nervousness_score * 100)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Enthusiasm</p>
                        <p className="text-lg font-semibold capitalize">
                          {currentEmotion.metrics.enthusiasm_level}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Confidence</p>
                        <p className="text-lg font-semibold capitalize">
                          {currentEmotion.metrics.confidence_indicator}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
                <CardDescription>Your pitch and AI coach feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-center text-text-secondary py-8">
                      No messages yet. Start by recording your pitch!
                    </p>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex gap-3",
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg px-4 py-3",
                            message.role === 'user'
                              ? 'bg-accent-lime/10 border border-accent-lime/30 text-text-primary'
                              : 'bg-surface-2 text-text-primary'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {message.emotion && (
                            <div className="mt-2 pt-2 border-t border-surface-3">
                              <EmotionIndicator emotion={message.emotion} />
                            </div>
                          )}
                          <p className="text-xs text-text-tertiary mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Upload Mode */}
        {pitchMode === 'upload' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Upload Audio File</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUploadedAudioFile(null);
                      setUploadError(null);
                      setPitchMode('select');
                    }}
                  >
                    Change Mode
                  </Button>
                </CardTitle>
                <CardDescription>
                  Upload a pre-recorded pitch (MP3 or WAV only) for analysis and coaching feedback.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload Section */}
                <div className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-surface-3 rounded-lg hover:border-accent-lime transition-colors">
                  <Upload className="h-12 w-12 text-text-tertiary" />
                  <div className="text-center">
                    <p className="text-sm text-text-secondary mb-2">
                      {uploadedAudioFile ? uploadedAudioFile.name : 'No file selected'}
                    </p>
                    <p className="text-xs text-text-tertiary mb-4">
                      Supported formats: MP3, WAV (Max size: 10MB)
                    </p>
                    <label htmlFor="audio-file-input">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isUploadingAudio}
                        onClick={() => document.getElementById('audio-file-input')?.click()}
                      >
                        Choose Audio File
                      </Button>
                    </label>
                    <input
                      id="audio-file-input"
                      type="file"
                      accept=".mp3,.wav,audio/mpeg,audio/wav"
                      onChange={handleAudioFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Error Display */}
                {uploadError && (
                  <div className="p-3 rounded-lg bg-red/10 border border-red/20">
                    <p className="text-sm text-red">{uploadError}</p>
                  </div>
                )}

                {/* Process Button */}
                {uploadedAudioFile && !uploadError && (
                  <Button
                    onClick={handleProcessUploadedAudio}
                    disabled={isUploadingAudio}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {isUploadingAudio ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing Audio...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Analyze Audio
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Emotion Analysis Card - Show if available */}
            {currentEmotion && (
              <Card>
                <CardHeader>
                  <CardTitle>Emotion Analysis</CardTitle>
                  <CardDescription>Real-time emotion detected from your pitch</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <EmotionIndicator emotion={currentEmotion} />
                  <EmotionBreakdown emotion={currentEmotion} />

                  {currentEmotion.metrics && (
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-text-secondary">Nervousness</p>
                        <p className="text-lg font-semibold">
                          {Math.round(currentEmotion.metrics.nervousness_score * 100)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Enthusiasm</p>
                        <p className="text-lg font-semibold capitalize">
                          {currentEmotion.metrics.enthusiasm_level}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Confidence</p>
                        <p className="text-lg font-semibold capitalize">
                          {currentEmotion.metrics.confidence_indicator}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Conversation Card */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis & Feedback</CardTitle>
                <CardDescription>AI coach analysis of your uploaded pitch</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-center text-text-secondary py-8">
                      Upload an audio file to receive analysis and feedback.
                    </p>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex gap-3",
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg px-4 py-3",
                            message.role === 'user'
                              ? 'bg-accent-lime/10 border border-accent-lime/30 text-text-primary'
                              : 'bg-surface-2 text-text-primary'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {message.emotion && (
                            <div className="mt-2 pt-2 border-t border-surface-3">
                              <EmotionIndicator emotion={message.emotion} />
                            </div>
                          )}
                          <p className="text-xs text-text-tertiary mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
