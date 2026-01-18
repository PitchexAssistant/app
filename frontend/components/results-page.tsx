"use client"

import { useEffect, useState } from "react"
import { EmotionTrendChart } from './charts/emotion-trend-chart'
import { PerformanceRadarChart } from './charts/performance-radar-chart'
import { SessionAnalysisModal } from '@/features/session-analysis'
import { Button } from '@/components/ui/button'
import { Presentation } from 'lucide-react'

interface ResultsPageProps {
  transcript: string
  analysis: {
    summary: string
    feedback_items: string[]
    scores?: {
      overall?: number
      clarity?: number
      confidence?: number
      engagement?: number
      persuasiveness?: number
      structure?: number
      delivery?: number
    }
    emotionTrend?: Array<{
      timestamp: number
      joy: number
      confidence: number
      nervousness: number
      anger: number
      surprise: number
    }>
  }
}

export function ResultsPage({
  transcript,
  analysis,
  onBack,
  onPracticeAgain
}: ResultsPageProps & {
  onBack?: () => void;
  onPracticeAgain?: () => void;
}) {
  return (
    <div className="min-h-screen bg-surface-0">
      <SessionAnalysisModal
        isOpen={true}
        onClose={onBack || (() => window.history.back())}
        analysis={analysis}
        transcript={transcript}
        onPracticeAgain={onPracticeAgain || (() => window.location.reload())}
      />
    </div>
  )
}

