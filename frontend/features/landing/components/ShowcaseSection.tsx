"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Brain, Target, Shield, MessageCircle, HelpCircle } from "lucide-react";

const learnItems = [
    {
        icon: Brain,
        title: "How investors think",
        description: "Understand what investors actually care about and how they evaluate pitches."
    },
    {
        icon: Target,
        title: "Identify weak spots",
        description: "Discover where your pitch is unclear, weak, or confusing before meeting real investors."
    },
    {
        icon: Shield,
        title: "Defend under pressure",
        description: "Learn how to defend your idea under pressure and handle tough questions."
    },
    {
        icon: MessageCircle,
        title: "Explain with clarity",
        description: "Master how to explain your startup simply and confidently in any situation."
    },
    {
        icon: HelpCircle,
        title: "Prepare for questions",
        description: "Know exactly what questions you should be prepared to answer next."
    }
];

// Avatar data with better Unsplash images (professional headshots) - 2x sizes
const avatars = [
    { src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face", size: 120, top: "5%", left: "10%" },
    { src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face", size: 100, top: "8%", left: "58%" },
    { src: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face", size: 90, top: "38%", left: "2%" },
    { src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face", size: 130, top: "35%", left: "38%" },
    { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face", size: 95, top: "20%", left: "75%" },
    { src: "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=200&h=200&fit=crop&crop=face", size: 110, top: "68%", left: "15%" },
    { src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face", size: 85, top: "65%", left: "60%" },
];

// Floating Avatars Visual Component
const FloatingAvatarsVisual = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const ctx = gsap.context(() => {
            // Staggered fade-in animation for avatars
            const avatarElements = containerRef.current?.querySelectorAll('.floating-avatar');
            if (avatarElements) {
                gsap.fromTo(avatarElements,
                    { opacity: 0, y: 30, scale: 0.9 },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        duration: 0.8,
                        stagger: 0.12,
                        ease: "power3.out"
                    }
                );
            }
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="relative w-full h-96 flex items-center justify-center">
            {/* Floating Avatars */}
            {avatars.map((avatar, index) => (
                <div
                    key={index}
                    className="floating-avatar absolute opacity-0"
                    style={{
                        top: avatar.top,
                        left: avatar.left,
                        width: avatar.size,
                        height: avatar.size,
                    }}
                >
                    <div
                        className="w-full h-full rounded-full p-[1px] bg-white/70 shadow-lg"
                        style={{
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)'
                        }}
                    >
                        <img
                            src={avatar.src}
                            alt={`Investor ${index + 1}`}
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export function ShowcaseSection() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!sectionRef.current) return;

        const ctx = gsap.context(() => {
            // Section fade-in and slide-up animation
            gsap.fromTo(sectionRef.current,
                { opacity: 0, y: 60 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 80%",
                        toggleActions: "play none none none"
                    }
                }
            );

            // Animate learn items with stagger
            const learnCards = sectionRef.current?.querySelectorAll('.learn-card');
            if (learnCards) {
                gsap.fromTo(learnCards,
                    { opacity: 0, x: 30 },
                    {
                        opacity: 1,
                        x: 0,
                        duration: 0.6,
                        stagger: 0.1,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: sectionRef.current,
                            start: "top 70%",
                            toggleActions: "play none none none"
                        }
                    }
                );
            }
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="py-24 bg-surface-0 relative overflow-hidden">
            {/* Background glows */}
            <div className="absolute top-1/2 left-0 w-96 h-96 bg-accent-lime/5 rounded-full blur-[150px] pointer-events-none -translate-y-1/2" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-green-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="container mx-auto px-6">
                {/* Main Card Container */}
                <div className="bg-surface-1 border border-surface-3 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">

                        {/* Left Side - Visual & Title */}
                        <div className="relative p-8 md:p-12 flex flex-col justify-between bg-gradient-to-br from-surface-1 to-surface-2">
                            {/* Floating Avatars Visual */}
                            <div className="flex-1 flex items-center justify-center py-8">
                                <FloatingAvatarsVisual />
                            </div>

                            {/* Title Content */}
                            <div className="space-y-4">
                                <h2 className="text-3xl md:text-4xl font-semibold text-accent-lime leading-tight">
                                    What you'll learn
                                </h2>
                                <p className="text-text-primary max-w-md">
                                    Practice with AI that simulates real investor conversations — get actionable feedback to refine your pitch before the real thing.
                                </p>
                            </div>
                        </div>

                        {/* Right Side - Learn Items */}
                        <div className="p-4 md:p-6 flex flex-col gap-3 bg-surface-0/50">
                            {learnItems.map((item, index) => (
                                <div
                                    key={index}
                                    className="learn-card group p-5 rounded-2xl bg-surface-1 border border-surface-3 hover:border-accent-lime/30 transition-all duration-300"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-surface-2 border border-white/5 flex items-center justify-center group-hover:bg-accent-lime/10 group-hover:border-accent-lime/20 transition-colors duration-300">
                                            <item.icon className="w-5 h-5 text-text-tertiary group-hover:text-accent-lime transition-colors duration-300" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-base font-semibold text-text-primary mb-1">
                                                {item.title}
                                            </h3>
                                            <p className="text-sm text-text-secondary leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
