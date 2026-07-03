"use client"

/**
 * Transcript Slide
 * Displays the full session transcript with scrolling and frosted glass effect
 */

interface TranscriptSlideProps {
    transcript: string
}

export function TranscriptSlide({
    transcript
}: TranscriptSlideProps) {
    return (
        <div className="flex flex-col py-6 min-h-[300px]">
            <h2 className="text-h4 text-text-primary text-center mb-2">
                Transcript
            </h2>
            <p className="text-caption text-text-secondary text-center mb-6">
                Review your full pitch
            </p>

            {/* Transcript container with fade gradient */}
            <div className="relative flex-1">
                <div
                    className="space-y-3 overflow-y-auto max-h-96 pr-2 pb-8"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(255,255,255,0.2) transparent'
                    }}
                >
                    <div className="bg-surface-2/50 rounded-lg p-6 border border-gray">
                        <p className="text-caption text-text-secondary leading-relaxed whitespace-pre-wrap">
                            {transcript}
                        </p>
                    </div>
                </div>

                {/* Bottom frosted glass gradient */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none backdrop-blur-[10px]"
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
