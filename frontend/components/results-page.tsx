"use client"

import { useEffect } from "react"
import { EmotionTrendChart } from './charts/emotion-trend-chart'
import { PerformanceRadarChart } from './charts/performance-radar-chart'

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
  useEffect(() => {
    // Log for debugging
    console.log('Results Page Loaded:', { transcript, analysis })
  }, [transcript, analysis])

  return (
    <div className="flex flex-col h-full bg-[#171717]">
      {/* Back Button - Aligned with content */}
      <div className="px-[32px] pt-[32px] pb-[16px]">
        <button
          className="w-[40px] h-[40px] flex items-center justify-center rounded-full bg-[#262626] hover:bg-[#2c2c33] transition-colors cursor-pointer"
          onClick={() => window.history.back()}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#f0f0f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-[32px] pb-[32px] overflow-y-auto scrollbar-hide min-h-0">
        <div className="flex gap-[32px] min-h-full pb-4">
          {/* Summary Section */}
          <div className="flex-1">
            <div className="bg-[#262626] rounded-[24px] p-[24px] flex flex-col gap-[20px] max-h-[calc(100vh-150px)]">
              <h2 className="font-['Inter'] font-bold text-[18px] text-[#f0f0f0] leading-[28px]">
                Summary
              </h2>

              {/* Scrollable content area containing both summary and scores */}
              <div className="flex flex-col gap-[20px] overflow-y-auto scrollbar-hide flex-1">
                <div className="bg-[#171717] rounded-[16px] p-[12px]">
                  <p className="font-['Uber_Move'] text-[16px] text-[#9e9e9e] leading-[24px] whitespace-pre-wrap">
                    {analysis.summary || 'Processing your pitch analysis...'}
                  </p>
                </div>

                {/* Scores Display */}
                {analysis.scores && (
                  <div className="bg-[#171717] rounded-[16px] p-[16px]">
                    <div className="grid grid-cols-2 gap-[12px]">
                      {analysis.scores.overall && (
                        <div className="flex flex-col gap-[4px]">
                          <span className="font-['Uber_Move'] text-[12px] text-[#9e9e9e]">Overall</span>
                          <span className="font-['Inter'] font-bold text-[24px] text-[#ff6b00]">
                            {analysis.scores.overall}%
                          </span>
                        </div>
                      )}
                      {analysis.scores.clarity && (
                        <div className="flex flex-col gap-[4px]">
                          <span className="font-['Uber_Move'] text-[12px] text-[#9e9e9e]">Clarity</span>
                          <span className="font-['Inter'] font-bold text-[24px] text-[#f0f0f0]">
                            {analysis.scores.clarity}%
                          </span>
                        </div>
                      )}
                      {analysis.scores.confidence && (
                        <div className="flex flex-col gap-[4px]">
                          <span className="font-['Uber_Move'] text-[12px] text-[#9e9e9e]">Confidence</span>
                          <span className="font-['Inter'] font-bold text-[24px] text-[#f0f0f0]">
                            {analysis.scores.confidence}%
                          </span>
                        </div>
                      )}
                      {analysis.scores.engagement && (
                        <div className="flex flex-col gap-[4px]">
                          <span className="font-['Uber_Move'] text-[12px] text-[#9e9e9e]">Engagement</span>
                          <span className="font-['Inter'] font-bold text-[24px] text-[#f0f0f0]">
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
          <div className="flex-1 flex flex-col gap-[32px] max-h-[calc(100vh-150px)] overflow-y-auto scrollbar-hide">
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
          <div className="w-[456px]">
            <div className="bg-[#262626] rounded-[24px] p-[24px] flex flex-col gap-[20px] max-h-[calc(100vh-150px)]">
              <h2 className="font-['Inter'] font-bold text-[18px] text-[#f0f0f0] leading-[28px]">
                Analysis & Feedback
              </h2>

              <div className="flex flex-col gap-[16px] overflow-y-auto flex-1 scrollbar-hide">
                {analysis.feedback_items && analysis.feedback_items.length > 0 ? (
                  analysis.feedback_items.map((feedback, index) => (
                    <div
                      key={index}
                      className="bg-[#171717] rounded-[16px] p-[12px]"
                    >
                      <p className="font-['Uber_Move'] text-[16px] text-[#9e9e9e] leading-[24px]">
                        {feedback}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="bg-[#171717] rounded-[16px] p-[12px]">
                    <p className="font-['Uber_Move'] text-[16px] text-[#9e9e9e] leading-[24px]">
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
    </div>
  )
}
