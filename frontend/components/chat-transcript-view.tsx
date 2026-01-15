/**
 * Chat Transcript View Component
 * Displays completed live sessions as Gemini-style chat transcript
 */

'use client'

import { useState } from 'react'
import { ArrowLeft, Download, Share2, ExternalLink } from 'lucide-react'

interface ConversationTurn {
    role: 'user' | 'assistant' | 'human' | 'ai'
    content: string
    timestamp?: number
    emotion?: {
        joy?: number
        confidence?: number
        nervousness?: number
        anger?: number
        surprise?: number
    }
}

interface SessionMetadata {
    title: string
    mode: string
    created_at: string
    completed_at?: string
}

interface ChatTranscriptViewProps {
    sessionId: string
    chatHistory: ConversationTurn[]
    metadata: SessionMetadata
    onBack: () => void
    onExport?: () => void
    onShare?: () => void
    onViewAnalysis?: () => void
}

export function ChatTranscriptView({
    sessionId,
    chatHistory,
    metadata,
    onBack,
    onExport,
    onShare,
    onViewAnalysis
}: ChatTranscriptViewProps) {
    const duration = calculateDuration(metadata.created_at, metadata.completed_at)
    const formattedDate = formatDate(metadata.created_at)

    return (
        <div className="flex flex-col h-full bg-[#171717] overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 bg-[#262626] border-b border-[#2c2c33] p-4 sm:p-6 z-10">
                <div className="flex items-start gap-3 sm:gap-4">
                    {/* Back Button */}
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-[#2c2c33] rounded-lg transition-colors flex-shrink-0"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#f0f0f0]" />
                    </button>

                    {/* Title and Meta */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-base sm:text-lg font-bold text-[#f0f0f0] truncate">
                            {metadata.title}
                        </h1>
                        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-[#9e9e9e] mt-1">
                            <span>Mode: {formatMode(metadata.mode)}</span>
                            {duration && <span>Duration: {duration}</span>}
                            <span>{formattedDate}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="hidden sm:flex gap-2 flex-shrink-0">
                        {onViewAnalysis && (
                            <button
                                onClick={onViewAnalysis}
                                className="px-3 py-1.5 bg-[#ff6b00] hover:bg-[#ff7f1a] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                            >
                                View Analysis
                                <ExternalLink className="w-4 h-4" />
                            </button>
                        )}
                        {onExport && (
                            <button
                                onClick={onExport}
                                className="px-3 py-1.5 bg-[#2c2c33] hover:bg-[#3a3a40] text-[#f0f0f0] text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        )}
                        {onShare && (
                            <button
                                onClick={onShare}
                                className="px-3 py-1.5 bg-[#2c2c33] hover:bg-[#3a3a40] text-[#f0f0f0] text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Share2 className="w-4 h-4" />
                                Share
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Actions */}
                <div className="flex sm:hidden gap-2 mt-3">
                    {onViewAnalysis && (
                        <button
                            onClick={onViewAnalysis}
                            className="flex-1 px-3 py-2 bg-[#ff6b00] text-white text-sm font-medium rounded-lg"
                        >
                            View Analysis
                        </button>
                    )}
                    {onExport && (
                        <button onClick={onExport} className="flex-1 px-3 py-2 bg-[#2c2c33] text-[#f0f0f0] text-sm rounded-lg">
                            Export
                        </button>
                    )}
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                {chatHistory.length > 0 ? (
                    chatHistory.map((turn, index) => (
                        <ChatMessage
                            key={index}
                            turn={turn}
                            isUser={turn.role === 'user' || turn.role === 'human'}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-[#9e9e9e] py-20">
                        <p className="text-lg font-medium">No conversation recorded</p>
                        <p className="text-sm mt-2">This session doesn't have any messages yet.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// Chat Message Component
interface ChatMessageProps {
    turn: ConversationTurn
    isUser: boolean
}

function ChatMessage({ turn, isUser }: ChatMessageProps) {
    const hasEmotions = turn.emotion && (
        (turn.emotion.confidence && turn.emotion.confidence > 0.3) ||
        (turn.emotion.joy && turn.emotion.joy > 0.3) ||
        (turn.emotion.nervousness && turn.emotion.nervousness > 0.3) ||
        (turn.emotion.anger && turn.emotion.anger > 0.3)
    )

    return (
        <div className={`flex gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div
                className={`
          w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0
          ${isUser ? 'bg-[#ff6b00]' : 'bg-[#262626]'}
        `}
            >
                {isUser ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" viewBox="0 0 24 24" fill="none">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                    </svg>
                ) : (
                    <span className="text-white text-xs sm:text-sm font-bold">M</span>
                )}
            </div>

            {/* Message Bubble */}
            <div className={`flex-1 max-w-[75%] sm:max-w-[70%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                    className={`
            rounded-2xl p-3 sm:p-4
            ${isUser
                            ? 'bg-[#ff6b00] text-white'
                            : 'bg-[#262626] text-[#f0f0f0]'
                        }
          `}
                >
                    <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                        {turn.content}
                    </p>

                    {/* Emotion Badges (only for user messages) */}
                    {isUser && hasEmotions && turn.emotion && (
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 pt-3 border-t border-white/20">
                            {turn.emotion.confidence !== undefined && turn.emotion.confidence > 0.3 && (
                                <EmotionBadge
                                    emoji="💪"
                                    label="Confidence"
                                    value={Math.round(turn.emotion.confidence * 100)}
                                />
                            )}
                            {turn.emotion.joy !== undefined && turn.emotion.joy > 0.3 && (
                                <EmotionBadge
                                    emoji="😊"
                                    label="Joy"
                                    value={Math.round(turn.emotion.joy * 100)}
                                />
                            )}
                            {turn.emotion.nervousness !== undefined && turn.emotion.nervousness > 0.3 && (
                                <EmotionBadge
                                    emoji="😰"
                                    label="Nervous"
                                    value={Math.round(turn.emotion.nervousness * 100)}
                                />
                            )}
                            {turn.emotion.anger !== undefined && turn.emotion.anger > 0.3 && (
                                <EmotionBadge
                                    emoji="😠"
                                    label="Anger"
                                    value={Math.round(turn.emotion.anger * 100)}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Timestamp */}
                {turn.timestamp && (
                    <span className="text-xs text-[#9e9e9e] mt-1">
                        {formatTime(turn.timestamp)}
                    </span>
                )}
            </div>
        </div>
    )
}

// Emotion Badge Component
function EmotionBadge({ emoji, label, value }: { emoji: string; label: string; value: number }) {
    return (
        <span className="text-xs bg-white/20 px-2 py-1 rounded inline-flex items-center gap-1">
            <span>{emoji}</span>
            <span>{label}</span>
            <span className="font-semibold">{value}%</span>
        </span>
    )
}

// Utility Functions
function calculateDuration(start: string, end?: string): string | null {
    if (!end) return null

    try {
        const startTime = new Date(start).getTime()
        const endTime = new Date(end).getTime()
        const diffMs = endTime - startTime
        const diffMins = Math.floor(diffMs / 60000)
        const diffSecs = Math.floor((diffMs % 60000) / 1000)

        if (diffMins > 0) {
            return `${diffMins}m ${diffSecs}s`
        } else {
            return `${diffSecs}s`
        }
    } catch {
        return null
    }
}

function formatDate(isoString: string): string {
    try {
        const date = new Date(isoString)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })
    } catch {
        return isoString
    }
}

function formatTime(timestamp: number): string {
    try {
        const date = new Date(timestamp * 1000)
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    } catch {
        return ''
    }
}

function formatMode(mode: string): string {
    const modeMap: Record<string, string> = {
        'pitch': 'Pitch Practice',
        'qa': 'Q&A Session',
        'negotiation': 'Negotiation Practice'
    }
    return modeMap[mode] || mode
}
