"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface EmotionDataPoint {
    timestamp: number // seconds
    joy: number
    confidence: number
    nervousness: number
    anger: number
    surprise: number
}

interface EmotionTrendChartProps {
    data: EmotionDataPoint[]
}

export function EmotionTrendChart({ data }: EmotionTrendChartProps) {
    // Format timestamp to MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <Card className="bg-[#262626] border-none">
            <CardHeader>
                <CardTitle className="font-['Inter'] font-bold text-[18px] text-[#f0f0f0]">
                    Emotion Trend Over Time
                </CardTitle>
                <CardDescription className="font-['Uber_Move'] text-[14px] text-[#9e9e9e]">
                    Track emotional changes throughout your pitch
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                        <XAxis
                            dataKey="timestamp"
                            tickFormatter={formatTime}
                            stroke="#9e9e9e"
                            style={{ fontSize: '12px', fontFamily: 'Uber Move' }}
                        />
                        <YAxis
                            stroke="#9e9e9e"
                            style={{ fontSize: '12px', fontFamily: 'Uber Move' }}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#171717',
                                border: '1px solid #404040',
                                borderRadius: '8px',
                                fontFamily: 'Uber Move'
                            }}
                            labelStyle={{ color: '#f0f0f0' }}
                            itemStyle={{ color: '#9e9e9e' }}
                            labelFormatter={formatTime}
                        />
                        <Legend
                            wrapperStyle={{
                                fontFamily: 'Uber Move',
                                fontSize: '12px',
                                color: '#9e9e9e'
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="joy"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ fill: '#10b981', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="confidence"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="nervousness"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={{ fill: '#f59e0b', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="anger"
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={{ fill: '#ef4444', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="surprise"
                            stroke="#a855f7"
                            strokeWidth={2}
                            dot={{ fill: '#a855f7', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
