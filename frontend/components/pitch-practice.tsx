"use client";

import { useState, useEffect } from 'react';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { useLiveSession, SessionMode } from '@/hooks/use-live-session';
import { useSessions } from '@/hooks/use-sessions';
import { api, Session as APISession } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmotionIndicator, EmotionBreakdown } from '@/components/emotion-indicator';
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
  onBack?: () => void;
  uploadedFiles?: UploadedPreview[];
  onDeleteFile?: (index: number) => void;
  initialSession?: APISession | null;
}

type PitchMode = 'select' | 'record' | 'live' | 'upload';

export function PitchPractice({ onBack, uploadedFiles = [], onDeleteFile, initialSession }: PitchPracticeProps) {
  const { user } = useUser();
  const [pitchMode, setPitchMode] = useState<PitchMode>('select');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<any>(null);
  const [sessionId] = useState<string>(() => `session_${Date.now()}`);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [hoveredFileIndex, setHoveredFileIndex] = useState<number | null>(null);
  const [liveMode, setLiveMode] = useState<SessionMode>('pitch');
  const [startTime] = useState<Date>(new Date());
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
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
          .filter(line => line.includes(':'))
          .map(line => {
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

  // Live session hook
  const liveSession = useLiveSession({
    sessionId: `live_${sessionId}`,
    mode: liveMode,
    context: uploadedFiles.map(f => f.filename).join(', '),
    onError: (err) => setError(err),
    onMessage: (msg) => {
      // Sync live session messages to state
      setMessages(prev => [...prev, msg]);
    }
  });

  // Sync live session messages to our messages state
  useEffect(() => {
    if (liveSession.messages.length > messages.length) {
      setMessages(liveSession.messages);
    }
  }, [liveSession.messages]);

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

  const handleEndSession = async () => {
    try {
      // Calculate duration
      const duration = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      
      // Update session with final data
      if (currentSession && user?.id) {
        const transcript = messages.map(m => `${m.role}: ${m.content}`).join('\n');
        // Convert summary to string if it's an object
        const summaryText = typeof liveSession.summary === 'string' 
          ? liveSession.summary 
          : liveSession.summary 
            ? `Session ${liveSession.summary.session_id}: ${liveSession.summary.message_count} messages in ${liveSession.summary.mode} mode`
            : `Session completed with ${messages.length} messages`;
        
        await updateSession(currentSession.id, {
          transcript: transcript || undefined,
          summary: summaryText || undefined,
          duration: duration > 0 ? duration : undefined,
        });
        
        await completeSession(currentSession.id);
      }
    } catch (error) {
      console.error('Error saving session:', error);
      // Continue with cleanup even if save fails
    }
    
    // End live session if active
    try {
      if (liveSession.isConnected) {
        await liveSession.endSession();
      }
    } catch (error) {
      console.error('Error ending live session:', error);
    }
    
    // Go back to dashboard
    onBack?.();
  };

  const handleStartRecording = async () => {
    setError(null);
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
      
      // Auto-save session with new messages
      if (currentSession && user?.id) {
        const transcript = newMessages.map(m => `${m.role}: ${m.content}`).join('\n');
        await updateSession(currentSession.id, {
          transcript,
          analysis: result.emotion,
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

  const handleAudioFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav)$/i)) {
      setUploadError('Please upload only MP3 or WAV audio files.');
      event.target.value = ''; // Reset input
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadError('File size must be less than 10MB.');
      event.target.value = ''; // Reset input
      return;
    }

    setUploadError(null);
    setUploadedAudioFile(file);
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
      
      // Auto-save session with new messages
      if (currentSession && user?.id) {
        const transcript = newMessages.map(m => `${m.role}: ${m.content}`).join('\n');
        await updateSession(currentSession.id, {
          transcript,
          analysis: result.emotion,
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
                className="text-white hover:bg-gray-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-white">
                {currentSession?.title || 'AI Pitch Practice'}
              </h1>
              <p className="text-gray-400 mt-1">
                {pitchMode === 'live' 
                  ? 'Live pitch coaching with Marcus Sterling AI'
                  : 'Practice your pitch with real-time emotion analysis and AI feedback'}
              </p>
            </div>
          </div>
        </div>

        {/* Mode Selection */}
        {pitchMode === 'select' && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Practice Mode</CardTitle>
              <CardDescription>Select how you'd like to practice your pitch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={async () => {
                    setPitchMode('live');
                    if (user?.id && !currentSession) {
                      const now = new Date();
                      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                      await createSession(`Live Session ${timeStr}`, 'live');
                    }
                  }}
                  className="p-6 rounded-lg border-2 border-green-500 bg-green-500/10 hover:bg-green-500/20 transition-all text-left group"
                >
                  <Radio className="h-8 w-8 text-green-500 mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">Live Session</h3>
                  <p className="text-sm text-gray-400">
                    Real-time coaching with Marcus Sterling AI. Get instant feedback as you pitch.
                  </p>
                  <div className="mt-3 text-xs text-green-400">
                    🎯 Recommended for practice
                  </div>
                </button>

                <button
                  onClick={async () => {
                    setPitchMode('record');
                    if (user?.id && !currentSession) {
                      const now = new Date();
                      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                      await createSession(`Record Session ${timeStr}`, 'record');
                    }
                  }}
                  className="p-6 rounded-lg border-2 border-zinc-700 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-left group"
                >
                  <Mic className="h-8 w-8 text-zinc-400 group-hover:text-blue-500 mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">Record & Analyze</h3>
                  <p className="text-sm text-gray-400">
                    Record your pitch, then get detailed emotion analysis and coaching feedback.
                  </p>
                </button>

                <button
                  onClick={async () => {
                    setPitchMode('upload');
                    if (user?.id && !currentSession) {
                      const now = new Date();
                      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                      await createSession(`Upload Session ${timeStr}`, 'upload');
                    }
                  }}
                  className="p-6 rounded-lg border-2 border-zinc-700 hover:border-purple-500 hover:bg-purple-500/10 transition-all text-left group"
                >
                  <Upload className="h-8 w-8 text-zinc-400 group-hover:text-purple-500 mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">Upload Audio</h3>
                  <p className="text-sm text-gray-400 mb-2">
                    Upload a pre-recorded pitch for analysis and feedback.
                  </p>
                  <p className="text-xs text-purple-400">
                    Supports: MP3, WAV (Max 10MB)
                  </p>
                </button>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-6 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                  <p className="text-sm text-zinc-300 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    You have {uploadedFiles.length} document{uploadedFiles.length > 1 ? 's' : ''} uploaded. 
                    The AI will reference these during your session.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
                        className={`px-3 py-2 pr-8 rounded-lg border ${i === selectedFileIndex ? 'border-green-500 bg-green-500/10' : 'border-zinc-800'} text-sm text-white transition-all`}
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
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-red-500/80 hover:bg-red-600 transition-colors"
                          title="Delete file"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="w-full h-96 bg-black/80 rounded-md overflow-hidden">
                  {uploadedFiles[selectedFileIndex]?.local_url ? (
                    <iframe
                      title={uploadedFiles[selectedFileIndex].filename}
                      src={uploadedFiles[selectedFileIndex].local_url}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-zinc-400">
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

        {/* Live Session Mode */}
        {pitchMode === 'live' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Live Pitch Session</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (liveSession.isConnected) {
                        liveSession.endSession();
                      }
                      setPitchMode('select');
                    }}
                  >
                    Change Mode
                  </Button>
                </CardTitle>
                <CardDescription>
                  {liveSession.isConnected 
                    ? `Live coaching with Marcus Sterling - Mode: ${liveMode.toUpperCase()}`
                    : 'Connect to start your live pitch coaching session'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!liveSession.isConnected ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-white mb-2 block">
                        Select Coaching Mode
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setLiveMode('pitch')}
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all text-sm",
                            liveMode === 'pitch'
                              ? "border-green-500 bg-green-500/20"
                              : "border-zinc-700 hover:border-green-500/50"
                          )}
                        >
                          <div className="font-semibold text-white">Pitch</div>
                          <div className="text-xs text-gray-400">Full presentation</div>
                        </button>
                        <button
                          onClick={() => setLiveMode('qa')}
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all text-sm",
                            liveMode === 'qa'
                              ? "border-blue-500 bg-blue-500/20"
                              : "border-zinc-700 hover:border-blue-500/50"
                          )}
                        >
                          <div className="font-semibold text-white">Q&A</div>
                          <div className="text-xs text-gray-400">Investor questions</div>
                        </button>
                        <button
                          onClick={() => setLiveMode('negotiation')}
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all text-sm",
                            liveMode === 'negotiation'
                              ? "border-purple-500 bg-purple-500/20"
                              : "border-zinc-700 hover:border-purple-500/50"
                          )}
                        >
                          <div className="font-semibold text-white">Negotiation</div>
                          <div className="text-xs text-gray-400">Terms & valuation</div>
                        </button>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      onClick={liveSession.startSession}
                      className="w-full"
                    >
                      <Radio className="h-4 w-4 mr-2" />
                      Start Live Session
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4">
                      {!liveSession.isRecording ? (
                        <Button
                          size="lg"
                          onClick={liveSession.startRecording}
                          className="h-16 w-16 rounded-full bg-green-600 hover:bg-green-700"
                        >
                          <Mic className="h-6 w-6" />
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          variant="destructive"
                          onClick={liveSession.stopRecording}
                          className="h-16 w-16 rounded-full animate-pulse"
                        >
                          <Square className="h-6 w-6" />
                        </Button>
                      )}
                      
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={handleEndSession}
                        className="gap-2"
                      >
                        End Session
                      </Button>
                    </div>

                    {liveSession.isRecording && (
                      <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500">
                          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-sm font-medium text-white">Live - Marcus is listening</span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center gap-2">
                      <Button
                        size="sm"
                        variant={liveSession.currentMode === 'pitch' ? 'default' : 'outline'}
                        onClick={() => liveSession.changeMode('pitch')}
                        disabled={liveSession.isRecording}
                      >
                        Pitch
                      </Button>
                      <Button
                        size="sm"
                        variant={liveSession.currentMode === 'qa' ? 'default' : 'outline'}
                        onClick={() => liveSession.changeMode('qa')}
                        disabled={liveSession.isRecording}
                      >
                        Q&A
                      </Button>
                      <Button
                        size="sm"
                        variant={liveSession.currentMode === 'negotiation' ? 'default' : 'outline'}
                        onClick={() => liveSession.changeMode('negotiation')}
                        disabled={liveSession.isRecording}
                      >
                        Negotiation
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {liveSession.summary && (
              <Card className="border-green-500">
                <CardHeader>
                  <CardTitle>Session Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300">
                      Session ended with {liveSession.summary.message_count} messages
                    </p>
                    <p className="text-sm text-gray-400">
                      Mode: {liveSession.summary.mode.toUpperCase()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Live Conversation</CardTitle>
                <CardDescription>Real-time coaching with Marcus Sterling</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {liveSession.messages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {liveSession.isConnected 
                        ? 'Click the microphone to start speaking...'
                        : 'Connect to start your session'}
                    </p>
                  ) : (
                    liveSession.messages.map((message, index) => (
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
                              ? 'bg-green-600 text-white'
                              : 'bg-zinc-800 text-white'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70 mt-2">
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

        {/* Record Mode */}
        {pitchMode === 'record' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Record Your Pitch</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      resetRecording();
                      setPitchMode('select');
                    }}
                  >
                    Change Mode
                  </Button>
                </CardTitle>
                <CardDescription>
                  Click the microphone to start recording. Your speech will be analyzed for emotions and coaching feedback.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  {!isRecording ? (
                    <Button
                      size="lg"
                      onClick={handleStartRecording}
                      className="h-16 w-16 rounded-full"
                      disabled={isProcessing}
                    >
                      <Mic className="h-6 w-6" />
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={handleStopRecording}
                      className="h-16 w-16 rounded-full animate-pulse"
                    >
                      <Square className="h-6 w-6" />
                    </Button>
                  )}
                  
                  {audioBlob && !isRecording && (
                    <Button
                      size="lg"
                      onClick={handleSendRecording}
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
                          Analyze Pitch
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {isRecording && (
                  <div className="text-center">
                    <p className="text-2xl font-mono font-bold text-primary">
                      {formatTime(recordingTime)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Recording...</p>
                  </div>
                )}

                {audioBlob && !isRecording && (
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        Recording ready • {formatTime(recordingTime)}
                      </p>
                      <button
                        onClick={() => {
                          resetRecording();
                          setError(null);
                        }}
                        className="p-1.5 rounded-full bg-red-500/80 hover:bg-red-600 transition-colors"
                        title="Delete recording"
                      >
                        <X className="h-3.5 w-3.5 text-white" />
                      </button>
                    </div>
                    <audio src={URL.createObjectURL(audioBlob)} controls className="mx-auto" />
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
                        <p className="text-sm text-muted-foreground">Nervousness</p>
                        <p className="text-lg font-semibold">
                          {Math.round(currentEmotion.metrics.nervousness_score * 100)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Enthusiasm</p>
                        <p className="text-lg font-semibold capitalize">
                          {currentEmotion.metrics.enthusiasm_level}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Confidence</p>
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
                    <p className="text-center text-muted-foreground py-8">
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
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {message.emotion && (
                            <div className="mt-2 pt-2 border-t border-primary-foreground/20">
                              <EmotionIndicator emotion={message.emotion} />
                            </div>
                          )}
                          <p className="text-xs opacity-70 mt-2">
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
                <div className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-zinc-700 rounded-lg hover:border-purple-500 transition-colors">
                  <Upload className="h-12 w-12 text-zinc-400" />
                  <div className="text-center">
                    <p className="text-sm text-zinc-300 mb-2">
                      {uploadedAudioFile ? uploadedAudioFile.name : 'No file selected'}
                    </p>
                    <p className="text-xs text-zinc-500 mb-4">
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
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400">{uploadError}</p>
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
                        <p className="text-sm text-muted-foreground">Nervousness</p>
                        <p className="text-lg font-semibold">
                          {Math.round(currentEmotion.metrics.nervousness_score * 100)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Enthusiasm</p>
                        <p className="text-lg font-semibold capitalize">
                          {currentEmotion.metrics.enthusiasm_level}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Confidence</p>
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
                    <p className="text-center text-muted-foreground py-8">
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
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {message.emotion && (
                            <div className="mt-2 pt-2 border-t border-primary-foreground/20">
                              <EmotionIndicator emotion={message.emotion} />
                            </div>
                          )}
                          <p className="text-xs opacity-70 mt-2">
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
