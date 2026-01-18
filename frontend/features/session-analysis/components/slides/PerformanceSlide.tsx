"use client"

/**
 * Performance Slide
 * Displays bar chart of performance metrics
 */

import type { AnalysisScores } from '../../types'

interface PerformanceSlideProps {
    scores?: AnalysisScores
}

const METRICS = [
    { key: 'clarity', label: 'Clarity' },
    { key: 'confidence', label: 'Confidence' },
    { key: 'persuasiveness', label: 'Persuasion' },
    { key: 'structure', label: 'Structure' },
    { key: 'delivery', label: 'Delivery' },
    { key: 'engagement', label: 'Engagement' }
] as const

export function PerformanceSlide({ scores }: PerformanceSlideProps) {
    if (!scores) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-text-secondary">No performance data available</p>
            </div>
        )
    }

    // Filter metrics that have values
    const availableMetrics = METRICS.filter(m =>
        scores[m.key as keyof AnalysisScores] !== undefined
    )

    // Find highest and lowest for highlights
    const sortedMetrics = [...availableMetrics].sort((a, b) => {
        const aVal = scores[a.key as keyof AnalysisScores] ?? 0
        const bVal = scores[b.key as keyof AnalysisScores] ?? 0
        return bVal - aVal
    })
    const highestKey = sortedMetrics[0]?.key
    const lowestKey = sortedMetrics[sortedMetrics.length - 1]?.key

    return (
        <div className="flex flex-col items-center justify-center py-8 h-full w-full">
            <h2 className="text-h4 text-text-primary mb-2">
                Performance Overview
            </h2>
            <p className="text-caption text-text-secondary mb-8">
                Your scores across key metrics
            </p>

            {/* Bar Chart */}
            <div className="w-full max-w-lg space-y-4">
                {availableMetrics.map(metric => {
                    const value = scores[metric.key as keyof AnalysisScores] ?? 0
                    const isHighest = metric.key === highestKey
                    const isLowest = metric.key === lowestKey && availableMetrics.length > 1

                    return (
                        <div key={metric.key} className="flex items-center gap-3">
                            {/* Label */}
                            <span className="text-caption text-text-primary w-24 text-right">
                                {metric.label}
                            </span>

                            {/* Bar Container */}
                            <div className="flex-1 h-8 bg-surface-2 rounded-lg overflow-hidden relative">
                                {/* Fill */}
                                <div
                                    className={`h-full rounded-lg transition-all duration-700 ${isHighest
                                            ? 'bg-accent-lime'
                                            : isLowest
                                                ? 'bg-voltage-orange'
                                                : metric.key === 'clarity' || metric.key === 'confidence'
                                                    ? 'bg-purple'
                                                    : metric.key === 'persuasiveness' || metric.key === 'delivery'
                                                        ? 'bg-magenta'
                                                        : 'bg-purple'
                                        }`}
                                    style={{ width: `${value}%` }}
                                />
                                {/* Value Label */}
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-caption font-semibold text-text-primary">
                                    {value}%
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-6 text-caption text-text-secondary">
                <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-accent-lime" />
                    <span>Strongest</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-voltage-orange" />
                    <span>Focus Area</span>
                </div>
            </div>
        </div>
    )
}
