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

export function ResultsPage({ transcript, analysis }: ResultsPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(true)

  useEffect(() => {
    // Log for debugging
    console.log('Results Page Loaded:', { transcript, analysis })
  }, [transcript, analysis])

  // Function to parse feedback text and render bold headings
  const renderFeedback = (text: string) => {
    // Match pattern: **Heading:** or **Heading** followed by the rest of text
    const parts = text.split(/(\*\*[^*]+\*\*:?)/)

    return parts.map((part, index) => {
      // Check if this part is a bold heading (surrounded by **)
      if (part.startsWith('**') && part.endsWith('**')) {
        // Remove the ** symbols and render as bold
        const boldText = part.replace(/\*\*/g, '')
        return (
          <strong key={index} className="font-bold text-[#f0f0f0]">
            {boldText}
          </strong>
        )
      } else if (part.startsWith('**') && part.includes('**')) {
        // Handle case like "**Text:** " - bold text with colon
        const boldText = part.replace(/\*\*/g, '')
        return (
          <strong key={index} className="font-bold text-[#f0f0f0]">
            {boldText}
          </strong>
        )
      } else {
        // Regular text
        return <span key={index}>{part}</span>
      }
    })
  }

  return (
    <div className="flex flex-col h-full bg-[#171717] overflow-x-hidden">
      {/* Back Button and View Analysis CTA */}
      <div className="px-[32px] pt-[32px] pb-[16px] flex items-center justify-between">
        <button
          className="w-[40px] h-[40px] flex items-center justify-center rounded-full bg-[#262626] hover:bg-[#2c2c33] transition-colors cursor-pointer"
          onClick={() => window.history.back()}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#f0f0f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <Button
          variant="default"
          onClick={() => setIsModalOpen(true)}
          className="gap-2"
        >
          <Presentation className="size-4" />
          View Full Analysis
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8 overflow-y-auto overflow-x-hidden scrollbar-hide min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 min-h-full pb-4 w-full max-w-full">
          {/* Summary Section */}
          <div className="w-full">
            <div className="bg-[#262626] rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 max-h-[calc(100vh-150px)]">
              <h2 className="font-['Inter'] font-bold text-base sm:text-lg text-[#f0f0f0] leading-tight">
                Summary
              </h2>

              {/* Scrollable content area containing both summary and scores */}
              <div className="flex flex-col gap-4 sm:gap-5 overflow-y-auto scrollbar-hide flex-1">
                <div className="bg-[#171717] rounded-xl sm:rounded-2xl p-3 sm:p-4">
                  <p className="font-['Uber_Move'] text-sm sm:text-base text-[#9e9e9e] leading-relaxed whitespace-pre-wrap break-words">
                    {analysis.summary || 'Processing your pitch analysis...'}
                  </p>
                </div>

                {/* Scores Display */}
                {analysis.scores && (
                  <div className="bg-[#171717] rounded-xl sm:rounded-2xl p-3 sm:p-4">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {analysis.scores.overall && (
                        <div className="flex flex-col gap-1">
                          <span className="font-['Uber_Move'] text-xs text-[#9e9e9e]">Overall</span>
                          <span className="font-['Inter'] font-bold text-xl sm:text-2xl text-[#ff6b00]">
                            {analysis.scores.overall}%
                          </span>
                        </div>
                      )}
                      {analysis.scores.clarity && (
                        <div className="flex flex-col gap-1">
                          <span className="font-['Uber_Move'] text-xs text-[#9e9e9e]">Clarity</span>
                          <span className="font-['Inter'] font-bold text-xl sm:text-2xl text-[#f0f0f0]">
                            {analysis.scores.clarity}%
                          </span>
                        </div>
                      )}
                      {analysis.scores.confidence && (
                        <div className="flex flex-col gap-1">
                          <span className="font-['Uber_Move'] text-xs text-[#9e9e9e]">Confidence</span>
                          <span className="font-['Inter'] font-bold text-xl sm:text-2xl text-[#f0f0f0]">
                            {analysis.scores.confidence}%
                          </span>
                        </div>
                      )}
                      {analysis.scores.engagement && (
                        <div className="flex flex-col gap-1">
                          <span className="font-['Uber_Move'] text-xs text-[#9e9e9e]">Engagement</span>
                          <span className="font-['Inter'] font-bold text-xl sm:text-2xl text-[#f0f0f0]">
                            {analysis.scores.engagement}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="w-full lg:col-span-1 xl:col-span-1 flex flex-col gap-4 sm:gap-6 lg:gap-8 max-h-[calc(100vh-150px)] overflow-y-auto scrollbar-hide">
            {/* Emotion Trend Chart */}
            {analysis.emotionTrend && analysis.emotionTrend.length > 0 && (
              <EmotionTrendChart data={analysis.emotionTrend} />
            )}

            {/* Performance Radar Chart */}
            {analysis.scores && (
              <PerformanceRadarChart
                data={{
                  clarity: analysis.scores.clarity || 0,
                  confidence: analysis.scores.confidence || 0,
                  persuasiveness: analysis.scores.persuasiveness || 0,
                  structure: analysis.scores.structure || 0,
                  delivery: analysis.scores.delivery || 0,
                  engagement: analysis.scores.engagement || 0,
                }}
              />
            )}
          </div>

          {/* Analysis & Feedback Section */}
          <div className="w-full xl:max-w-[456px]">
            <div className="bg-[#262626] rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 max-h-[calc(100vh-150px)]">
              <h2 className="font-['Inter'] font-bold text-base sm:text-lg text-[#f0f0f0] leading-tight">
                Analysis & Feedback
              </h2>

              <div className="flex flex-col gap-3 sm:gap-4 overflow-y-auto flex-1 scrollbar-hide">
                {analysis.feedback_items && analysis.feedback_items.length > 0 ? (
                  analysis.feedback_items.map((feedback, index) => (
                    <div
                      key={index}
                      className="bg-[#171717] rounded-xl sm:rounded-2xl p-3 sm:p-4"
                    >
                      <p className="font-['Uber_Move'] text-sm sm:text-base text-[#9e9e9e] leading-relaxed break-words">
                        {renderFeedback(feedback)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="bg-[#171717] rounded-xl sm:rounded-2xl p-3 sm:p-4">
                    <p className="font-['Uber_Move'] text-sm sm:text-base text-[#9e9e9e] leading-relaxed">
                      Analyzing your pitch performance...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript Section (Optional - can be toggled) */}
      {transcript && (
        <div className="mt-[32px]">
          <details className="bg-[#262626] rounded-[16px] p-[12px]">
            <summary className="font-['Uber_Move'] font-medium text-[14px] text-[#f0f0f0] cursor-pointer">
              View Transcript
            </summary>
            <div className="mt-[12px] pt-[12px] border-t border-[#404040]">
              <p className="font-['Uber_Move'] text-[14px] text-[#9e9e9e] leading-[20px]">
                {transcript}
              </p>
            </div>
          </details>
        </div>
      )}

      {/* Session Analysis Carousel Modal */}
      <SessionAnalysisModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        analysis={analysis}
        transcript={transcript}
        onPracticeAgain={() => {
          setIsModalOpen(false)
          window.location.reload()
        }}
      />
    </div>
  )
}

