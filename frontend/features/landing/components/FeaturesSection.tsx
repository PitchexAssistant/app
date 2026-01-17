"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Mic, MessageSquare, LineChart, Sparkles, Play, Pause } from 'lucide-react';
import gsap from "gsap";

const features = [
    {
        title: "Pitch your idea",
        description: "Start with your idea", // Using the text from the image for the subtitle/desc structure if needed, or sticking to user's copy. User said "The copy for the cards are... Pitch your idea...". 
        // Wait, user provided specific copy in previous turn. "Pitch your idea", "Describe your startup..."
        // The image shows "AI SyncUps..." "Start with your idea". 
        // I will use USER's provided copy for Title/Desc, but IMAGE's visual style.
        longDescription: "Describe your startup like you would to an investor. No slides, no prep — just your idea.",
        icon: Mic,
        number: "1",
        color: "lightblue",
    },
    {
        title: "Face real questions",
        longDescription: "Our AI challenges you with tough, investor-style questions based on your pitch.",
        icon: MessageSquare,
        number: "2",
        color: "magenta",
    },
    {
        title: "Refine and improve",
        longDescription: "See where you hesitated, what wasn't clear, and what needs work before a real meeting.",
        icon: LineChart,
        number: "3",
        color: "green",
    }
];

// Visual Components for each card
const AudioVisual = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cursorRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);
    const waveContainerRef = useRef<HTMLDivElement>(null);
    const gradientGlowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || !cursorRef.current || !buttonRef.current || !waveContainerRef.current) return;

        const bars = waveContainerRef.current.children;
        const ctx = gsap.context(() => {
            // Subtle gradient glow rotation animation
            if (gradientGlowRef.current) {
                gsap.to(gradientGlowRef.current, {
                    rotation: 360,
                    duration: 8,
                    repeat: -1,
                    ease: "none"
                });
                // Subtle pulse effect
                gsap.to(gradientGlowRef.current, {
                    opacity: 0.4,
                    scale: 1.05,
                    duration: 2,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut"
                });
            }

            // Initial bars animation (idle/low)
            gsap.to(bars, {
                scaleY: "random(0.1, 0.3)",
                duration: 0.5,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                stagger: { each: 0.1, from: "center", repeat: -1 }
            });

            const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

            // 1. Initial State
            tl.set(cursorRef.current, { x: 80, y: 80, opacity: 0, scale: 1 });
            tl.set(buttonRef.current, { scale: 1, boxShadow: "none" });

            // 2. Mouse Enters
            tl.to(cursorRef.current, {
                x: 0,
                y: 0,
                opacity: 1,
                duration: 1,
                ease: "power2.out"
            });

            // 3. Click Animation
            tl.to(cursorRef.current, { scale: 0.8, duration: 0.15, ease: "power1.in" });
            tl.to(buttonRef.current, { scale: 0.9, duration: 0.15, ease: "power1.in" }, "<");

            // 4. Release & Activate
            tl.to(cursorRef.current, { scale: 1, duration: 0.15, ease: "power1.out" });
            tl.to(buttonRef.current, {
                scale: 1,
                duration: 0.15,
                ease: "back.out(1.7)",
                boxShadow: "0 0 30px rgba(178, 246, 59, 0.4)"
            }, "<");

            // 5. Active State Animation (Waves grow)
            tl.to(bars, {
                scaleY: "random(0.4, 1.5)",
                duration: 0.5,
                overwrite: true, // Overwrite the idle animation
                repeat: 4, // Run for a few seconds
                yoyo: true,
                ease: "sine.inOut",
                stagger: { each: 0.05, from: "center" }
            }, "<");

            // 6. Mouse Leaves
            tl.to(cursorRef.current, {
                x: 60,
                y: 100,
                opacity: 0,
                duration: 0.8,
                ease: "power2.in"
            }, "+=0.5");

            // 7. Reset to Idle after recording duration
            tl.to(bars, {
                scaleY: "random(0.1, 0.3)",
                duration: 0.5,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                stagger: { each: 0.1, from: "center", repeat: -1 }
            }, "+=1.5");

            tl.to(buttonRef.current, { boxShadow: "none", duration: 0.5 }, "<");

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="relative w-full h-[220px] flex items-center justify-center overflow-hidden">

            {/* Animated Gradient Glow behind mic button */}
            <div
                ref={gradientGlowRef}
                className="absolute w-32 h-32 rounded-full opacity-25 blur-xl pointer-events-none"
                style={{
                    background: 'conic-gradient(from 0deg, rgba(178, 246, 59, 0.4), rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3), rgba(178, 246, 59, 0.4))'
                }}
            />

            {/* Main Mic Button Circle */}
            <div
                ref={buttonRef}
                className="relative z-10 w-20 h-20 rounded-full border border-accent-lime/50 bg-surface-1 flex items-center justify-center group"
            >

                {/* Inner subtle gradient */}
                <div className="absolute inset-[1px] rounded-full bg-surface-2 bg-gradient-to-b from-white/5 to-transparent flex items-center justify-center">
                    <Mic className="w-8 h-8 text-accent-lime" />
                </div>
            </div>

            {/* Audio Waveform Background */}
            <div ref={waveContainerRef} className="absolute inset-0 flex items-center justify-center gap-1.5 pointer-events-none opacity-40">
                {[...Array(24)].map((_, i) => (
                    <div
                        key={i}
                        className="w-1.5 bg-surface-3 rounded-full"
                        style={{ height: '20px' }}
                    />
                ))}
            </div>

            {/* Mouse Cursor */}
            <div
                ref={cursorRef}
                className="absolute z-20 pointer-events-none drop-shadow-lg"
                style={{ top: '50%', left: '50%', marginLeft: '10px', marginTop: '10px' }} // Positioned relative to center button
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.65376 12.3673H5.46023L5.31717 12.4976L0.500002 16.8829L0.500002 1.19169L11.7841 12.3673H5.65376Z" fill="white" stroke="black" strokeWidth="1" />
                </svg>
            </div>

            {/* Background Glow */}
            <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-3xl -z-10" />
        </div>
    );
};

import { Orb } from "@/components/ui/orb";

// ... (previous imports)

const ChatVisual = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const particlesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || !particlesRef.current) return;

        // Particle System
        const particleCount = 20;
        const container = particlesRef.current;
        const particles: HTMLDivElement[] = [];

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement("div");
            const size = Math.random() * 3 + 1;

            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${Math.random() > 0.5 ? '#d946ef' : '#8b5cf6'};
                border-radius: 50%;
                opacity: ${Math.random() * 0.5 + 0.2};
                pointer-events: none;
            `;

            container.appendChild(particle);
            particles.push(particle);

            // Set initial random position
            gsap.set(particle, {
                x: Math.random() * 300 - 150,
                y: Math.random() * 200 - 100,
            });

            // Animate
            gsap.to(particle, {
                x: `random(-150, 150)`,
                y: `random(-100, 100)`,
                opacity: `random(0.2, 0.6)`,
                duration: `random(3, 8)`,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            });
        }

        return () => {
            particles.forEach(p => p.remove());
        };
    }, []);

    return (
        <div ref={containerRef} className="relative w-full h-[220px] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-magenta/5 to-transparent rounded-xl" />

            {/* Particles Container */}
            <div ref={particlesRef} className="absolute inset-0 flex items-center justify-center pointer-events-none" />

            {/* Central Floating Orb */}
            <div className="relative w-32 h-32">
                <Orb
                    colors={["#d946ef", "#8b5cf6"]}
                    agentState="thinking"
                    className="w-full h-full"
                />
            </div>

            {/* Background Glow */}
            <div className="absolute inset-0 bg-magenta/10 rounded-full blur-3xl -z-10" />
        </div>
    );
};

const AnalysisVisual = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const clarityBarRef = useRef<HTMLDivElement>(null);
    const persuasionCircleRef = useRef<SVGCircleElement>(null);
    const confidenceRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const ctx = gsap.context(() => {
            // Animate Clarity bar
            if (clarityBarRef.current) {
                gsap.fromTo(clarityBarRef.current,
                    { scaleX: 0 },
                    {
                        scaleX: 1,
                        duration: 1.4,
                        ease: "power2.out",
                        delay: 0.3
                    }
                );
            }

            // Animate Persuasion circular progress (stroke draws in)
            if (persuasionCircleRef.current) {
                const circumference = 2 * Math.PI * 28; // radius = 28
                const targetOffset = circumference - (circumference * 0.88); // 88%
                gsap.fromTo(persuasionCircleRef.current,
                    { strokeDashoffset: circumference },
                    {
                        strokeDashoffset: targetOffset,
                        duration: 1.6,
                        ease: "power2.out",
                        delay: 0.5
                    }
                );
            }

            // Animate Confidence number counting up with glow pulse
            if (confidenceRef.current) {
                const numEl = confidenceRef.current.querySelector('.confidence-num');
                if (numEl) {
                    gsap.fromTo(numEl,
                        { textContent: 0, opacity: 0.5 },
                        {
                            textContent: 92,
                            opacity: 1,
                            duration: 1.5,
                            ease: "power2.out",
                            delay: 0.4,
                            snap: { textContent: 1 },
                            onUpdate: function () {
                                if (numEl) {
                                    numEl.textContent = Math.round(Number(numEl.textContent || 0)).toString();
                                }
                            }
                        }
                    );
                }

                // Subtle glow pulse
                gsap.to(confidenceRef.current, {
                    boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
                    duration: 1.5,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    delay: 1.5
                });
            }

            // Subtle floating for all metric cards
            gsap.to(".metric-card", {
                y: -3,
                duration: 2.5,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                stagger: 0.3
            });

        }, containerRef);

        return () => ctx.revert();
    }, []);

    const circumference = 2 * Math.PI * 28;

    return (
        <div ref={containerRef} className="relative w-full h-[220px] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 rounded-xl" />

            {/* 3 Metrics Grid */}
            <div className="flex items-center gap-3">

                {/* Clarity - Horizontal Bar */}
                <div className="metric-card flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-2/80 backdrop-blur-sm border border-white/5">
                    <span className="text-[10px] font-medium text-text-tertiary">Clarity</span>
                    <div className="w-16 h-16 flex items-center justify-center">
                        <div className="w-full space-y-1.5">
                            <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden">
                                <div
                                    ref={clarityBarRef}
                                    className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full origin-left"
                                    style={{ width: '92%' }}
                                />
                            </div>
                            <div className="text-center">
                                <span className="text-lg font-bold text-green-400">92</span>
                                <span className="text-[10px] text-text-tertiary">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Persuasion - Circular Ring */}
                <div className="metric-card flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-2/80 backdrop-blur-sm border border-white/5">
                    <span className="text-[10px] font-medium text-text-tertiary">Persuasion</span>
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                            {/* Background circle */}
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                className="text-surface-3"
                            />
                            {/* Progress circle */}
                            <circle
                                ref={persuasionCircleRef}
                                cx="32"
                                cy="32"
                                r="28"
                                fill="none"
                                stroke="url(#persuasionGradient)"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={circumference}
                            />
                            <defs>
                                <linearGradient id="persuasionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#a855f7" />
                                    <stop offset="100%" stopColor="#d946ef" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-purple-400">88</span>
                            <span className="text-[10px] text-text-tertiary">%</span>
                        </div>
                    </div>
                </div>

                {/* Confidence - Glowing Number */}
                <div
                    ref={confidenceRef}
                    className="metric-card flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-2/80 backdrop-blur-sm border border-blue-500/20"
                >
                    <span className="text-[10px] font-medium text-text-tertiary">Confidence</span>
                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                        <div className="text-center">
                            <span className="confidence-num text-2xl font-bold text-blue-400">0</span>
                            <span className="text-xs text-text-tertiary">%</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Background glows */}
            <div className="absolute bottom-2 left-1/4 w-24 h-24 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-2 right-1/4 w-20 h-20 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-4 right-1/3 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>
    );
};
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function FeaturesSection() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!sectionRef.current) return;

        const ctx = gsap.context(() => {
            // Section header reveal
            const header = sectionRef.current?.querySelector('.features-header');
            if (header) {
                gsap.fromTo(header,
                    { opacity: 0, y: 40 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.8,
                        ease: "power3.out",
                        scrollTrigger: {
                            trigger: sectionRef.current,
                            start: "top 80%",
                            toggleActions: "play none none none"
                        }
                    }
                );
            }

            // Feature cards staggered reveal
            const cards = sectionRef.current?.querySelectorAll('.feature-card');
            if (cards) {
                gsap.fromTo(cards,
                    { opacity: 0, y: 50, scale: 0.95 },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        duration: 0.7,
                        stagger: 0.15,
                        ease: "power3.out",
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
        <section ref={sectionRef} className="py-30 bg-surface-0 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-magenta/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-950/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                {/* Section Header */}
                <div className="features-header text-center space-y-4 mb-20 opacity-0">

                    <h2 className="text-4xl md:text-5xl font-semibold text-text-primary">
                        AI with full context – <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary">
                            embedded in your workflow
                        </span>
                    </h2>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Feature 1 */}
                    <div className="feature-card group flex flex-col rounded-3xl bg-surface-1 border border-surface-3 transition-all duration-300 hover:border-surface-3/80 overflow-hidden cursor-default shadow-2xl opacity-0">
                        {/* Top Visual Area */}
                        <div className="flex-1 relative bg-gradient-to-b from-[#121212] to-surface-1 min-h-[220px] flex items-center justify-center overflow-hidden">
                            <AudioVisual />
                            {/* Top shimmer border */}
                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent opacity-50" />
                        </div>

                        {/* Bottom Content Area */}
                        <div className="p-3">
                            <div className="relative bg-surface-2/70 backdrop-blur-sm p-5 rounded-2xl border border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-semibold text-text-primary">Pitch your idea</h3>
                                    <span className="flex items-center justify-center w-6 h-6 rounded bg-surface-3 text-xs font-mono text-text-tertiary border border-white/5">1</span>
                                </div>
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    Describe your startup like you would to an investor. No slides, no prep — just your idea.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="feature-card group flex flex-col rounded-3xl bg-surface-1 border border-surface-3 transition-all duration-300 hover:border-surface-3/80 overflow-hidden cursor-default shadow-2xl opacity-0">
                        {/* Top Visual Area */}
                        <div className="flex-1 relative bg-gradient-to-b from-[#121212] to-surface-1 min-h-[220px] flex items-center justify-center overflow-hidden">
                            <ChatVisual />
                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-magenta/30 to-transparent opacity-50" />
                        </div>

                        {/* Bottom Content Area */}
                        <div className="p-3">
                            <div className="relative bg-surface-2/70 backdrop-blur-sm p-5 rounded-2xl border border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-semibold text-text-primary">Face real questions</h3>
                                    <span className="flex items-center justify-center w-6 h-6 rounded bg-surface-3 text-xs font-mono text-text-tertiary border border-white/5">2</span>
                                </div>
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    Our AI challenges you with tough, investor-style questions based on your pitch.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Feature 3 */}
                    <div className="feature-card group flex flex-col rounded-3xl bg-surface-1 border border-surface-3 transition-all duration-300 hover:border-surface-3/80 overflow-hidden cursor-default shadow-2xl opacity-0">
                        {/* Top Visual Area */}
                        <div className="flex-1 relative bg-gradient-to-b from-[#121212] to-surface-1 min-h-[220px] flex items-center justify-center overflow-hidden">
                            <AnalysisVisual />
                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-green-500/30 to-transparent opacity-50" />
                        </div>

                        {/* Bottom Content Area */}
                        <div className="p-3">
                            <div className="relative bg-surface-2/70 backdrop-blur-sm p-5 rounded-2xl border border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-semibold text-text-primary">Refine and improve</h3>
                                    <span className="flex items-center justify-center w-6 h-6 rounded bg-surface-3 text-xs font-mono text-text-tertiary border border-white/5">3</span>
                                </div>
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    See where you hesitated, what wasn't clear, and what needs work before a real meeting.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
