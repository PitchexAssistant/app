"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PerformanceRadarChartProps {
    data: {
        clarity: number
        confidence: number
        persuasiveness: number
        structure: number
        delivery: number
        engagement: number
    }
}

interface MetricBarProps {
    label: string
    score: number
    index: number
    isHovered: boolean
    onHover: (index: number | null) => void
}

function MetricBar({ label, score, index, isHovered, onHover }: MetricBarProps) {
    const maxHeight = 140
    const barHeight = (score / 100) * maxHeight

    // Color gradient based on score
    const getColor = (score: number) => {
        if (score >= 80) return { bar: '#22c55e', glow: 'rgba(34, 197, 94, 0.3)' }
        if (score >= 60) return { bar: '#ff6b00', glow: 'rgba(255, 107, 0, 0.3)' }
        if (score >= 40) return { bar: '#eab308', glow: 'rgba(234, 179, 8, 0.3)' }
        return { bar: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' }
    }

    const colors = getColor(score)

    return (
        <div
            className="flex flex-col items-center gap-1 sm:gap-2 cursor-pointer flex-1 min-w-[40px] max-w-[60px]"
            onMouseEnter={() => onHover(index)}
            onMouseLeave={() => onHover(null)}
        >
            {/* Score tooltip */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{
                    opacity: isHovered ? 1 : 0.8,
                    y: 0,
                    scale: isHovered ? 1.1 : 1
                }}
                className={`
                    px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold
                    ${isHovered ? 'bg-[#ff6b00] text-white' : 'bg-[#262626] text-[#f0f0f0]'}
                    transition-colors duration-200
                `}
            >
                {score}%
            </motion.div>

            {/* Bar container */}
            <div
                className="relative w-6 sm:w-8 lg:w-10 rounded-lg overflow-hidden"
                style={{
                    height: Math.min(maxHeight, 160),
                    backgroundColor: 'rgba(38, 38, 38, 0.8)'
                }}
            >
                {/* Animated bar */}
                <motion.div
                    initial={{ height: 0 }}
                    animate={{
                        height: barHeight,
                        boxShadow: isHovered
                            ? `0 0 15px ${colors.glow}`
                            : `0 0 8px ${colors.glow}`
                    }}
                    transition={{
                        height: { duration: 0.8, delay: index * 0.1, ease: "easeOut" },
                        boxShadow: { duration: 0.2 }
                    }}
                    className="absolute bottom-0 left-0 right-0 rounded-lg"
                    style={{
                        background: `linear-gradient(to top, ${colors.bar}, ${colors.bar}dd)`,
                    }}
                />
            </div>

            {/* Label */}
            <motion.span
                animate={{
                    color: isHovered ? '#ff6b00' : '#9e9e9e',
                    scale: isHovered ? 1.05 : 1
                }}
                className={`text-[9px] sm:text-[10px] font-medium text-center leading-tight ${isHovered ? 'whitespace-nowrap z-10 bg-[#171717] px-1 rounded' : 'truncate w-full'}`}
            >
                {label}
            </motion.span>
        </div>
    )
}

function CircularProgress({ score, label }: { score: number; label: string }) {
    const radius = 35
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (score / 100) * circumference

    const getColor = (score: number) => {
        if (score >= 80) return '#22c55e'
        if (score >= 60) return '#ff6b00'
        if (score >= 40) return '#eab308'
        return '#ef4444'
    }

    return (
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                    {/* Background circle */}
                    <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke="#262626"
                        strokeWidth="6"
                        fill="none"
                    />
                    {/* Progress circle */}
                    <motion.circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke={getColor(score)}
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        style={{
                            strokeDasharray: circumference,
                            filter: `drop-shadow(0 0 6px ${getColor(score)}50)`
                        }}
                    />
                </svg>
                {/* Score text */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-base sm:text-lg font-bold text-[#f0f0f0]"
                    >
                        {score}%
                    </motion.span>
                </div>
            </div>
            <span className="text-[10px] sm:text-xs text-[#9e9e9e] text-center">{label}</span>
        </div>
    )
}

export function PerformanceRadarChart({ data }: PerformanceRadarChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    const metrics = [
        { key: 'clarity', label: 'Clarity', score: data.clarity },
        { key: 'confidence', label: 'Confidence', score: data.confidence },
        { key: 'persuasiveness', label: 'Persuasive', score: data.persuasiveness },
        { key: 'structure', label: 'Structure', score: data.structure },
        { key: 'delivery', label: 'Delivery', score: data.delivery },
        { key: 'engagement', label: 'Engage', score: data.engagement },
    ]

    const average = Math.round(
        metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length
    )
    const highest = Math.max(...metrics.map(m => m.score))
    const lowest = Math.min(...metrics.map(m => m.score))

    return (
        <Card className="bg-[#262626] border-none">
            <CardHeader className="pb-2">
                <CardTitle className="font-['Inter'] font-bold text-[18px] text-[#f0f0f0] flex items-center gap-2">
                    Performance Overview
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs font-normal text-[#9e9e9e] bg-[#171717] px-2 py-1 rounded"
                    >
                        Interactive
                    </motion.span>
                </CardTitle>
                <CardDescription className="font-['Uber_Move'] text-[14px] text-[#9e9e9e]">
                    Hover over bars for details
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-3 sm:pb-4">
                {/* Bar Chart */}
                <div className="bg-[#171717] rounded-xl p-2 sm:p-3 lg:p-4 mb-3 sm:mb-4 overflow-x-auto overflow-y-hidden">
                    <div className="flex justify-between items-end gap-1 min-w-[280px]">
                        {metrics.map((metric, index) => (
                            <MetricBar
                                key={metric.key}
                                label={metric.label}
                                score={metric.score}
                                index={index}
                                isHovered={hoveredIndex === index}
                                onHover={setHoveredIndex}
                            />
                        ))}
                    </div>
                </div>

                {/* Circular Progress Summary */}
                <div className="flex flex-wrap justify-center sm:justify-around items-center gap-4 sm:gap-6 bg-[#171717] rounded-xl p-3 sm:p-4 overflow-hidden">
                    <CircularProgress score={average} label="Average" />
                    <CircularProgress score={highest} label="Highest" />
                    <CircularProgress score={lowest} label="Lowest" />
                </div>
            </CardContent>
        </Card>
    )
}
