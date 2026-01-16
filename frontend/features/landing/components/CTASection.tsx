"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from '@/components/ui/button';
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function CTASection() {
    const sectionRef = useRef<HTMLElement>(null);
    const maskRef = useRef<HTMLDivElement>(null);
    const leftLineRef = useRef<HTMLDivElement>(null);
    const rightLineRef = useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        if (!sectionRef.current) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = sectionRef.current?.getBoundingClientRect();
            if (!rect) return;

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            setMousePosition({ x, y });
        };

        const handleMouseEnter = () => setIsHovering(true);
        const handleMouseLeave = () => setIsHovering(false);

        const section = sectionRef.current;
        section.addEventListener('mousemove', handleMouseMove);
        section.addEventListener('mouseenter', handleMouseEnter);
        section.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            section.removeEventListener('mousemove', handleMouseMove);
            section.removeEventListener('mouseenter', handleMouseEnter);
            section.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    // Animate the mask position with GSAP for smooth movement
    useEffect(() => {
        if (!maskRef.current) return;

        gsap.to(maskRef.current, {
            '--mouse-x': `${mousePosition.x}px`,
            '--mouse-y': `${mousePosition.y}px`,
            duration: 0.3,
            ease: "power2.out"
        });
    }, [mousePosition]);

    // Animate mask size on hover
    useEffect(() => {
        if (!maskRef.current) return;

        gsap.to(maskRef.current, {
            '--mask-size': isHovering ? '250px' : '0px',
            duration: 0.4,
            ease: "power2.out"
        });
    }, [isHovering]);

    // Sparkle animation for decorative lines
    useEffect(() => {
        if (!leftLineRef.current || !rightLineRef.current) return;

        const ctx = gsap.context(() => {
            // Left line sparkle animation
            const leftSparkle = leftLineRef.current?.querySelector('.sparkle');
            if (leftSparkle) {
                gsap.to(leftSparkle, {
                    top: '100%',
                    duration: 3,
                    ease: "none",
                    repeat: -1,
                    delay: 0
                });
                gsap.to(leftSparkle, {
                    opacity: 0.8,
                    duration: 0.5,
                    ease: "sine.inOut",
                    repeat: -1,
                    yoyo: true
                });
            }

            // Right line sparkle animation (offset timing)
            const rightSparkle = rightLineRef.current?.querySelector('.sparkle');
            if (rightSparkle) {
                gsap.to(rightSparkle, {
                    top: '100%',
                    duration: 3.5,
                    ease: "none",
                    repeat: -1,
                    delay: 1.5
                });
                gsap.to(rightSparkle, {
                    opacity: 0.8,
                    duration: 0.6,
                    ease: "sine.inOut",
                    repeat: -1,
                    yoyo: true,
                    delay: 1.5
                });
            }

            // Subtle pulse on the lines themselves
            gsap.to([leftLineRef.current, rightLineRef.current], {
                opacity: 0.15,
                duration: 2,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                stagger: 0.5
            });
        });

        return () => ctx.revert();
    }, []);

    // Scroll-triggered reveal animation
    useEffect(() => {
        if (!sectionRef.current) return;

        const ctx = gsap.context(() => {
            // Watermark reveal
            const watermark = sectionRef.current?.querySelector('.cta-watermark');
            if (watermark) {
                gsap.fromTo(watermark,
                    { opacity: 0, scale: 0.9 },
                    {
                        opacity: 1,
                        scale: 1,
                        duration: 1,
                        ease: "power3.out",
                        scrollTrigger: {
                            trigger: sectionRef.current,
                            start: "top 80%",
                            toggleActions: "play none none none"
                        }
                    }
                );
            }

            // Button reveal
            const button = sectionRef.current?.querySelector('.cta-button');
            if (button) {
                gsap.fromTo(button,
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.7,
                        ease: "power3.out",
                        delay: 0.3,
                        scrollTrigger: {
                            trigger: sectionRef.current,
                            start: "top 80%",
                            toggleActions: "play none none none"
                        }
                    }
                );
            }
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={sectionRef}
            className="relative py-32 md:py-32 bg-surface-0 overflow-hidden cursor-crosshair"
        >
            {/* Base watermark - outline/stroke version (always visible) */}
            <div className="cta-watermark absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-0">
                <h1
                    className="text-[20vw] md:text-[20vw] lg:text-[20vw] font-bold tracking-tighter"
                    style={{
                        WebkitTextStroke: '1px rgba(255, 255, 255, 0.08)',
                        WebkitTextFillColor: 'transparent',
                        color: 'transparent'
                    }}
                >
                    Pitchex
                </h1>
            </div>

            {/* Masked reveal layer - filled version with glow */}
            <div
                ref={maskRef}
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                style={{
                    '--mouse-x': '0px',
                    '--mouse-y': '0px',
                    '--mask-size': '0px',
                    maskImage: 'radial-gradient(circle var(--mask-size) at var(--mouse-x) var(--mouse-y), black 0%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(circle var(--mask-size) at var(--mouse-x) var(--mouse-y), black 0%, transparent 100%)',
                } as React.CSSProperties}
            >
                <h1
                    className="text-[20vw] md:text-[20vw] lg:text-[20vw] font-bold tracking-tighter"
                    style={{
                        color: 'rgba(200, 200, 210, 0.7)',
                        textShadow: '0 0 80px rgba(200, 200, 210, 0.4), 0 0 120px rgba(180, 180, 195, 0.25)'
                    }}
                >
                    Pitchex
                </h1>
            </div>

            {/* Glow effect following mouse */}
            <div
                className="absolute w-64 h-64 rounded-full pointer-events-none transition-opacity duration-300"
                style={{
                    left: mousePosition.x - 128,
                    top: mousePosition.y - 128,
                    background: 'radial-gradient(circle, rgba(200, 200, 210, 0.12) 0%, transparent 70%)',
                    opacity: isHovering ? 1 : 0,
                    filter: 'blur(300px)'
                }}
            />

            {/* Center button */}
            <div className="cta-button relative z-10 mb-80 flex items-center justify-center h-full min-h-[200px] opacity-0">
                <Link href="/sign-up">
                    <Button
                        size="lg"
                        className="px-8 py-6 text-base font-medium shadow-xl shadow-accent-lime/20 hover:bg-accent-hover hover:text-surface-0 hover:shadow-accent-lime/30 transition-all duration-300"
                    >
                        Start Pitching
                    </Button>
                </Link>
            </div>

            {/* Decorative lines - left and right with sparkle animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Left vertical accent with sparkle */}
                <div
                    ref={leftLineRef}
                    className="absolute left-[8%] top-[15%] bottom-[15%] w-px bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-100"
                >
                    {/* Traveling sparkle */}
                    <div
                        className="sparkle absolute left-1/2 -translate-x-1/2 w-1 h-8 top-0"
                        style={{
                            background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.6), rgba(251,255,80,0.4), transparent)',
                            filter: 'blur(1px)',
                            boxShadow: '0 0 8px rgba(251,255,80,0.5)'
                        }}
                    />
                </div>

                {/* Right vertical accent with sparkle */}
                <div
                    ref={rightLineRef}
                    className="absolute right-[8%] top-[15%] bottom-[15%] w-px bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-100"
                >
                    {/* Traveling sparkle */}
                    <div
                        className="sparkle absolute left-1/2 -translate-x-1/2 w-1 h-8 top-0"
                        style={{
                            background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.6), rgba(251,255,80,0.4), transparent)',
                            filter: 'blur(1px)',
                            boxShadow: '0 0 8px rgba(251,255,80,0.5)'
                        }}
                    />
                </div>
            </div>
        </section>
    );
}

