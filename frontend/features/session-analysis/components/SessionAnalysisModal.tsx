"use client"

/**
 * Session Analysis Modal
 * Multi-step carousel with animated gradient background (75vw x 75vh)
 */

import { useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Share2, RotateCcw } from 'lucide-react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useCarouselNavigation } from '../hooks/useCarouselNavigation'
import { SummarySlide } from './slides/SummarySlide'
import { ScoresSlide } from './slides/ScoresSlide'
import { PerformanceSlide } from './slides/PerformanceSlide'
import { FeedbackSlide } from './slides/FeedbackSlide'
import type { SessionAnalysisModalProps } from '../types'

export function SessionAnalysisModal({
    isOpen,
    onClose,
    analysis,
    onPracticeAgain,
    onShare
}: SessionAnalysisModalProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const totalSlides = 4

    const {
        currentSlide,
        goToSlide,
        goNext,
        goPrev,
        isFirst,
        isLast
    } = useCarouselNavigation({ totalSlides, onClose })

    // Gradient animation on mount
    useGSAP(() => {
        if (isOpen) {
            gsap.fromTo(".analysis-gradient",
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 0.9, duration: 1.5, ease: "power2.out" }
            )
        }
    }, { scope: containerRef, dependencies: [isOpen] })

    if (!isOpen) return null

    const slides = [
        <SummarySlide key="summary" summary={analysis.summary} />,
        <ScoresSlide key="scores" scores={analysis.scores} />,
        <PerformanceSlide key="performance" scores={analysis.scores} />,
        <FeedbackSlide
            key="feedback"
            summary={analysis.summary}
            feedbackItems={analysis.feedback_items}
        />
    ]

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
            {/* Modal Container - 75vw x 75vh */}
            <div className="relative w-[75vw] h-[75vh] border border-border-gray max-w-4xl bg-surface-0 rounded-2xl overflow-hidden">
                {/* Animated Gradient Background */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    {/* Left Globe */}
                    <div
                        className="analysis-gradient absolute -bottom-[45%] -left-[25%] w-[100%] h-[100%] rounded-full blur-[100px]"
                        style={{
                            background: `radial-gradient(circle at center, 
                                rgba(64, 83, 214, 0.85) 0%, 
                                rgba(45, 140, 255, 0.55) 25%, 
                                rgba(88, 28, 135, 0.35) 50%, 
                                rgba(128, 0, 255, 0.25) 75%, 
                                transparent 100%
                            )`
                        }}
                    />
                    {/* Right Globe */}
                    <div
                        className="analysis-gradient absolute -bottom-[45%] -right-[25%] w-[100%] h-[100%] rounded-full blur-[100px]"
                        style={{
                            background: `radial-gradient(circle at center, 
                                rgba(64, 83, 214, 0.85) 0%, 
                                rgba(45, 140, 255, 0.55) 25%, 
                                rgba(88, 28, 135, 0.35) 50%, 
                                rgba(128, 0, 255, 0.25) 75%,
                                transparent 100%
                            )`
                        }}
                    />
                </div>

                {/* Close Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 text-text-primary hover:bg-surface-2"
                >
                    <X className="size-5" />
                </Button>

                {/* Pagination Dots */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                    {Array.from({ length: totalSlides }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goToSlide(i)}
                            className={cn(
                                "w-2 h-2 rounded-full transition-all duration-300",
                                currentSlide === i
                                    ? "w-6 bg-text-primary"
                                    : "bg-text-tertiary hover:bg-text-secondary"
                            )}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>

                {/* Slide Content */}
                <div className="relative z-10 w-full h-full flex items-center justify-center px-16">
                    <div className="w-full max-w-3xl overflow-hidden">
                        <div
                            className="flex transition-transform duration-500 ease-out"
                            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                        >
                            {slides.map((slide, i) => (
                                <div key={i} className="w-full flex-shrink-0">
                                    {slide}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Share Button - visible on last slide */}
                {isLast && onShare && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                        <Button
                            variant="outline"
                            onClick={onShare}
                            className="gap-2"
                        >
                            <Share2 className="size-4" />
                            Share
                        </Button>
                    </div>
                )}
            </div>

            {/* Navigation Arrows - Outside Modal */}
            <button
                onClick={goPrev}
                disabled={isFirst}
                className={cn(
                    "absolute left-[calc(12.5vw-32px)] top-1/2 -translate-y-1/2 z-30",
                    "size-12 rounded-full bg-text-primary text-surface-0",
                    "flex items-center justify-center transition-all",
                    "hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
                )}
                aria-label="Previous slide"
            >
                <ChevronLeft className="size-6" />
            </button>

            <button
                onClick={goNext}
                disabled={isLast}
                className={cn(
                    "absolute right-[calc(12.5vw-32px)] top-1/2 -translate-y-1/2 z-30",
                    "size-12 rounded-full bg-text-primary text-surface-0",
                    "flex items-center justify-center transition-all",
                    "hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
                )}
                aria-label="Next slide"
            >
                <ChevronRight className="size-6" />
            </button>

            {/* Practice Again Button - Bottom of screen, visible on last slide */}
            {isLast && onPracticeAgain && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
                    <Button
                        variant="default"
                        onClick={onPracticeAgain}
                        className="gap-2"
                    >
                        <RotateCcw className="size-5" />
                        Practice Again
                    </Button>
                </div>
            )}
        </div>
    )
}
