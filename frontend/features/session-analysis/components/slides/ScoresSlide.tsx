"use client"

/**
 * Scores Slide
 * Displays the 4 key metrics: Overall, Clarity, Confidence, Engagement
 */

import type { AnalysisScores } from '../../types'

interface ScoresSlideProps {
    scores?: AnalysisScores
}

export function ScoresSlide({ scores }: ScoresSlideProps) {
    const metrics = [
        { key: 'overall', label: 'Overall', value: scores?.overall },
        { key: 'clarity', label: 'Clarity', value: scores?.clarity },
        { key: 'confidence', label: 'Confidence', value: scores?.confidence },
        { key: 'engagement', label: 'Engagement', value: scores?.engagement }
    ]

    return (
        <div className="flex flex-col items-center justify-center text-center py-8 h-full w-full">
            <h2 className="text-h4 text-text-primary mb-2">
                Your Scores
            </h2>
            <p className="text-caption text-text-secondary mb-8">
                Key performance metrics
            </p>

            <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
                {metrics.map(metric => (
                    <div
                        key={metric.key}
                        className="flex flex-col items-center p-4 bg-gradient-to-br from-surface-2 to-surface-1 rounded-xl"
                    >
                        <span className="text-caption text-text-secondary mb-2">
                            {metric.label}
                        </span>
                        <span className={`text-[56px] font-semibold leading-none ${metric.key === 'overall' ? 'text-accent-lime' : 'text-text-primary'
                            }`}>
                            {metric.value ?? 0}
                            <span className="text-[24px]">%</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
