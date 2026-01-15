import { Zap, Users, Target, TrendingUp } from 'lucide-react';
import { ShowcaseCard, Feature } from './types';

export const showcaseCards: ShowcaseCard[] = [
    {
        id: 1,
        image: "/Home-1.png",
        alt: "Pitchex Dashboard - Transform your ideas into winning pitches",
    },
    {
        id: 2,
        image: "/live-session-ready-1.png",
        alt: "Live Session Ready - Real-time collaboration and feedback",
    },
    {
        id: 3,
        image: "/live-session-start.png",
        alt: "Live Session Active - Dynamic pitch presentation mode",
    },
];

export const features: Feature[] = [
    {
        icon: Zap,
        title: "AI-Powered Insights",
        description: "Get intelligent feedback and suggestions to strengthen your pitch with cutting-edge AI technology."
    },
    {
        icon: Users,
        title: "Real-Time Collaboration",
        description: "Work together with your team in live sessions, sharing ideas and refining your pitch instantly."
    },
    {
        icon: Target,
        title: "Targeted Practice",
        description: "Practice with industry-specific scenarios and get feedback tailored to your audience and market."
    },
    {
        icon: TrendingUp,
        title: "Performance Analytics",
        description: "Track your progress with detailed analytics and insights to continuously improve your pitching skills."
    }
];
