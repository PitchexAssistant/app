"use client";

import { DASHBOARD_COPY } from "../constants";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";

interface DashboardLandingProps {
    onStartPitching: () => void;
}

export function DashboardLanding({ onStartPitching }: DashboardLandingProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        // Single revealing gradient animation - "Timer" effect
        // Rising from bottom
        gsap.fromTo(".lime-gradient",
            {
                y: "100%", // Start fully below
                opacity: 0.8
            },
            {
                y: "40%", // Move up
                duration: 5, // Reveal duration
                ease: "power2.out", // Smooth deceleration
                delay: 0.5
            }
        );
    }, { scope: containerRef });

    return (
        <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden flex flex-col items-center justify-center">
            {/* Gradient Background Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Left Globe */}
                <div
                    className="lime-gradient absolute -bottom-[15%] -left-[40%] w-[100vw] h-[100vw] rounded-full blur-[120px] opacity-90"
                    style={{
                        background: `
                            radial-gradient(circle at center, 
                                rgba(64, 83, 214, 0.85) 0%, 
                                rgba(45, 140, 255, 0.55) 25%, 
                                rgba(88, 28, 135, 0.35) 50%, 
                                rgba(128, 0, 255, 0.25) 75%, 
                                transparent 100%
                            )
                        `,
                        transform: "translateY(100%)" // Initial state managed by GSAP
                    }}
                />

                {/* Right Globe */}
                <div
                    className="lime-gradient absolute -bottom-[15%] -right-[40%] w-[100vw] h-[100vw] rounded-full blur-[120px] opacity-90"
                    style={{
                        background: `
                            radial-gradient(circle at center, 
                                rgba(64, 83, 214, 0.85) 0%, 
                                rgba(45, 140, 255, 0.55) 25%, 
                                rgba(88, 28, 135, 0.35) 50%, 
                                rgba(128, 0, 255, 0.25) 75%,
                                transparent 100%
                            )
                        `,
                        transform: "translateY(100%)" // Initial state managed by GSAP
                    }}
                />
            </div>

            {/* Content Layer */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-8 px-8 max-w-4xl mx-auto text-center">
                {/* Text Content */}
                <div className="flex flex-col gap-4">
                    <h1 className="text-[length:var(--typeface-font-styles-heading-h2)] md:text-[length:var(--typeface-font-styles-heading-h1)] font-bold text-white leading-[1.1] tracking-tight">
                        {DASHBOARD_COPY.landing.title}
                    </h1>
                    <p className="text-[length:var(--typeface-font-styles-heading-h5)] md:text-[length:var(--typeface-font-styles-heading-subheading)] text-text-primary leading-relaxed max-w-2xl mx-auto">
                        {DASHBOARD_COPY.landing.subtitle}
                    </p>
                </div>

                {/* CTA Button */}
                <Button
                    variant="default"
                    onClick={onStartPitching}
                >
                    {DASHBOARD_COPY.landing.cta}
                </Button>
            </div>
        </div>
    );
}
