"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const benefits = [
    "AI-POWERED FEEDBACK",
    "REAL-TIME PRACTICE",
    "INVESTOR SIMULATIONS"
];

export function BenefitsSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const marqueeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!marqueeRef.current || !sectionRef.current) return;

        const marqueeContent = marqueeRef.current.querySelector('.marquee-content');
        if (!marqueeContent) return;

        // Get the width of the marquee content
        const contentWidth = marqueeContent.scrollWidth / 2;

        // Create infinite scroll animation
        const ctx = gsap.context(() => {
            // Scroll-triggered reveal animation
            gsap.fromTo(marqueeRef.current,
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 85%",
                        toggleActions: "play none none none"
                    }
                }
            );

            // Infinite marquee scroll
            gsap.to(marqueeContent, {
                x: -contentWidth,
                duration: 20,
                ease: "none",
                repeat: -1
            });
        });

        return () => ctx.revert();
    }, []);

    // Create the benefit items with dots
    const MarqueeItems = () => (
        <>
            {benefits.map((benefit, index) => (
                <span key={index} className="flex items-center gap-8">
                    <span className="text-text-primary font-semibold text-2xl md:text-3xl lg:text-4xl tracking-wide whitespace-nowrap">
                        {benefit}
                    </span>
                    <span className="w-3 h-3 rounded-full bg-accent-lime flex-shrink-0" />
                </span>
            ))}
        </>
    );

    return (
        <section ref={sectionRef} className="py-12 bg-surface-0 overflow-hidden">
            <div ref={marqueeRef} className="relative opacity-0">
                <div className="marquee-content flex items-center gap-8">
                    {/* Duplicate content for seamless loop */}
                    <MarqueeItems />
                    <MarqueeItems />
                </div>
            </div>
        </section>
    );
}
