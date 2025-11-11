"use client";

import { useState, useEffect } from 'react';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmotionIndicator, EmotionBreakdown } from '@/components/emotion-indicator';
import { Mic, Square, Loader2, Send, ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export function PitchPractice({ onBack, uploadedFiles = [], onDeleteFile }: PitchPracticeProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<any>(null);
  const [sessionId] = useState<string>(() => `session_${Date.now()}`);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [hoveredFileIndex, setHoveredFileIndex] = useState<number | null>(null);

  const {
    isRecording,
    recordingTime,
    audioBlob,
    startRecording,
    stopRecording,
    resetRecording,
    error: recordingError,
  } = useAudioRecorder();

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

      setMessages(prev => [
        ...prev,
        {
          role: 'user',
          content: result.transcript,
          emotion: result.emotion,
          timestamp: new Date(),
        },
      ]);

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: result.response,
          timestamp: new Date(),
        },
      ]);

      setCurrentEmotion(result.emotion);
      resetRecording();
    } catch (err: any) {
      console.error('Processing error:', err);
      setError(err.message || 'Failed to process audio. Please try again.');
    } finally {
      setIsProcessing(false);
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
              <h1 className="text-3xl font-bold text-white">AI Pitch Practice</h1>
              <p className="text-gray-400 mt-1">
                Practice your pitch with real-time emotion analysis and AI feedback
              </p>
            </div>
          </div>
        </div>

        {uploadedFiles && uploadedFiles.length > 0 && (
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

        <Card>
          <CardHeader>
            <CardTitle>Record Your Pitch</CardTitle>
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
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Recording ready • {formatTime(recordingTime)}
                </p>
                <audio src={URL.createObjectURL(audioBlob)} controls className="mx-auto mt-2" />
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
      </div>
    </div>
  );
}
