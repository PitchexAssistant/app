"use client"

/**
 * Overall Score Slide
 * Displays the big score number with encouraging message
 */

import { getScoreMessage } from '../../constants'
import type { AnalysisScores } from '../../types'

interface OverallScoreSlideProps {
    scores?: AnalysisScores
}

export function OverallScoreSlide({ scores }: OverallScoreSlideProps) {
    const overallScore = scores?.overall ?? 0
    const { title, message } = getScoreMessage(overallScore)

    return (
        <div className="flex flex-col items-center justify-center text-center py-12 min-h-[400px]">
            {/* Encouraging Title */}
            <h2 className="text-h4 text-text-primary mb-4">
                {title}
            </h2>

            {/* Big Score Number */}
            <div className="relative mb-4">
                <span className="text-[120px] sm:text-[160px] font-bold text-text-primary leading-none">
                    {overallScore}
                </span>
                <span className="text-[60px] sm:text-[80px] font-bold text-text-primary">%</span>

                {/* Gradient Underline */}
                <div
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-1 rounded-full"
                    style={{
                        background: 'linear-gradient(90deg, rgba(251,255,80,1) 0%, rgba(88,97,248,1) 50%, rgba(212,55,160,1) 100%)'
                    }}
                />
            </div>

            {/* Label */}
            <p className="text-h5 text-text-primary mb-2">
                Overall Score
            </p>

            {/* Encouraging Message */}
            <p className="text-body text-text-secondary max-w-xs">
                {message}
            </p>
        </div>
    )
}
