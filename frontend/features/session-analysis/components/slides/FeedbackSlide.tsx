"use client"

/**
 * Feedback Slide
 * Displays grammar and tone feedback
 */

interface FeedbackSlideProps {
    summary: string
    feedbackItems: string[]
}

export function FeedbackSlide({
    feedbackItems
}: FeedbackSlideProps) {
    // Parse feedback text for bold headings
    const renderFeedback = (text: string) => {
        const parts = text.split(/(\*\*[^*]+\*\*:?)/)
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.includes('**')) {
                const boldText = part.replace(/\*\*/g, '')
                return (
                    <strong key={index} className="font-semibold text-text-primary">
                        {boldText}
                    </strong>
                )
            }
            return <span key={index}>{part}</span>
        })
    }

    return (
        <div className="flex flex-col py-6 min-h-[300px]">
            <h2 className="text-h4 text-text-primary text-center mb-2">
                Grammar & Tone
            </h2>
            <p className="text-caption text-text-secondary text-center mb-6">
                Key insights to improve your pitch
            </p>

            {/* Feedback Items with fade gradient */}
            <div className="relative flex-1">
                <div
                    className="space-y-3 overflow-y-auto max-h-96 pr-2 pb-8"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(255,255,255,0.2) transparent'
                    }}
                >
                    {feedbackItems && feedbackItems.length > 0 ? (
                        feedbackItems.slice(0, 3).map((feedback, index) => (
                            <div
                                key={index}
                                className="bg-surface-2/50 rounded-lg p-3"
                            >
                                <p className="text-caption text-text-secondary leading-relaxed">
                                    {renderFeedback(feedback)}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-text-tertiary text-center py-4">
                            No feedback available
                        </p>
                    )}
                </div>

                {/* Bottom frosted glass gradient */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none backdrop-blur-[10px]"
                    style={{
                        background: 'linear-gradient(to top, #1717170 10%, rgba(85, 0, 121, 0.01) 40%, rgba(23, 23, 23, 0.01) 70%, transparent 100%)',
                        maskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)'
                    }}
                />
            </div>
        </div>
    )
}
