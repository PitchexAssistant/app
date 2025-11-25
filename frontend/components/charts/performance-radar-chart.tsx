"use client"

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PerformanceData {
    category: string
    score: number
    fullMark: number
}

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

export function PerformanceRadarChart({ data }: PerformanceRadarChartProps) {
    const chartData: PerformanceData[] = [
        { category: 'Clarity', score: data.clarity, fullMark: 100 },
        { category: 'Confidence', score: data.confidence, fullMark: 100 },
        { category: 'Persuasiveness', score: data.persuasiveness, fullMark: 100 },
        { category: 'Structure', score: data.structure, fullMark: 100 },
        { category: 'Delivery', score: data.delivery, fullMark: 100 },
        { category: 'Engagement', score: data.engagement, fullMark: 100 },
    ]

    return (
        <Card className="bg-[#262626] border-none">
            <CardHeader>
                <CardTitle className="font-['Inter'] font-bold text-[18px] text-[#f0f0f0]">
                    Performance Overview
                </CardTitle>
                <CardDescription className="font-['Uber_Move'] text-[14px] text-[#9e9e9e]">
                    Your pitch skills across key dimensions
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={chartData}>
                        <PolarGrid stroke="#404040" />
                        <PolarAngleAxis
                            dataKey="category"
                            stroke="#9e9e9e"
                            style={{
                                fontSize: '13px',
                                fontFamily: 'Uber Move',
                                fill: '#f0f0f0'
                            }}
                        />
                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            stroke="#9e9e9e"
                            style={{ fontSize: '11px' }}
                        />
                        <Radar
                            name="Score"
                            dataKey="score"
                            stroke="#ff6b00"
                            fill="#ff6b00"
                            fillOpacity={0.6}
                            strokeWidth={2}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#171717',
                                border: '1px solid #404040',
                                borderRadius: '8px',
                                fontFamily: 'Uber Move'
                            }}
                            labelStyle={{ color: '#f0f0f0' }}
                            itemStyle={{ color: '#ff6b00' }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
