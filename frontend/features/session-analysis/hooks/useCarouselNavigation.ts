/**
 * Carousel Navigation Hook
 * Manages slide state, keyboard navigation, and gestures
 */

import { useState, useCallback, useEffect } from 'react'

interface UseCarouselNavigationOptions {
    totalSlides: number
    onClose?: () => void
}

export function useCarouselNavigation({ totalSlides, onClose }: UseCarouselNavigationOptions) {
    const [currentSlide, setCurrentSlide] = useState(0)

    const goToSlide = useCallback((index: number) => {
        if (index >= 0 && index < totalSlides) {
            setCurrentSlide(index)
        }
    }, [totalSlides])

    const goNext = useCallback(() => {
        if (currentSlide < totalSlides - 1) {
            setCurrentSlide(prev => prev + 1)
        }
    }, [currentSlide, totalSlides])

    const goPrev = useCallback(() => {
        if (currentSlide > 0) {
            setCurrentSlide(prev => prev - 1)
        }
    }, [currentSlide])

    const isFirst = currentSlide === 0
    const isLast = currentSlide === totalSlides - 1

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowRight':
                    goNext()
                    break
                case 'ArrowLeft':
                    goPrev()
                    break
                case 'Escape':
                    onClose?.()
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [goNext, goPrev, onClose])

    return {
        currentSlide,
        goToSlide,
        goNext,
        goPrev,
        isFirst,
        isLast,
        totalSlides
    }
}
