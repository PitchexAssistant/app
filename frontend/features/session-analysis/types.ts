/**
 * Session Analysis Types
 * Using existing backend data structure from results-page.tsx
 */

export interface AnalysisScores {
    overall?: number
    clarity?: number
    confidence?: number
    engagement?: number
    persuasiveness?: number
    structure?: number
    delivery?: number
}

export interface EmotionDataPoint {
    timestamp: number
    joy: number
    confidence: number
    nervousness: number
    anger: number
    surprise: number
}

export interface SessionAnalysis {
    summary: string
    feedback_items: string[]
    scores?: AnalysisScores
    emotionTrend?: EmotionDataPoint[]
}

export interface SessionAnalysisModalProps {
    isOpen: boolean
    onClose: () => void
    analysis: SessionAnalysis
    transcript?: string
    onPracticeAgain?: () => void
    onShare?: () => void
}

export type SlideType = 'score' | 'performance' | 'feedback'
