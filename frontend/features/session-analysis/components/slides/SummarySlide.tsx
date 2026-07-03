"use client"

/**
 * Summary Slide
 * Displays the pitch summary text
 */

interface SummarySlideProps {
    summary: string
}

export function SummarySlide({ summary }: SummarySlideProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-12 h-full w-full">
            <h2 className="text-h4 text-text-primary mb-6">
                Session Summary
            </h2>

            <div className="max-w-lg">
                <p className="text-xl text-text-primary leading-relaxed">
                    {summary || 'Analyzing your pitch performance...'}
                </p>
            </div>
        </div>
    )
}
