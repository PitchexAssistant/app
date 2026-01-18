/**
 * Session Analysis Constants
 */

export const SLIDE_CONFIG = {
    score: {
        title: 'Overall Score',
        order: 0
    },
    performance: {
        title: 'Performance Overview',
        order: 1
    },
    feedback: {
        title: 'Analysis & Feedback',
        order: 2
    }
} as const

export const SCORE_MESSAGES = {
    excellent: { threshold: 80, title: 'Excellent!', message: 'Outstanding pitch performance. You nailed it!' },
    great: { threshold: 60, title: 'Great Job!', message: 'Strong pitch with room for refinement.' },
    good: { threshold: 40, title: 'Good Effort!', message: 'Solid foundation. Keep practicing!' },
    developing: { threshold: 0, title: 'Keep Going!', message: 'Every pitch makes you better.' }
} as const

export function getScoreMessage(score: number) {
    if (score >= SCORE_MESSAGES.excellent.threshold) return SCORE_MESSAGES.excellent
    if (score >= SCORE_MESSAGES.great.threshold) return SCORE_MESSAGES.great
    if (score >= SCORE_MESSAGES.good.threshold) return SCORE_MESSAGES.good
    return SCORE_MESSAGES.developing
}
