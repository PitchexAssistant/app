"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";

// Business school logos - using reliable CDN sources
const businessSchools = [
    { name: "Harvard", logo: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Harvard_University_coat_of_arms.svg" },
    { name: "Stanford", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Stanford_University_logo.svg" },
    { name: "MIT", logo: "https://upload.wikimedia.org/wikipedia/commons/0/0c/MIT_logo.svg" },
    { name: "Yale", logo: "https://upload.wikimedia.org/wikipedia/commons/0/07/Yale_University_Shield_1.svg" },
    { name: "Princeton", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1f/Princeton_Shield.svg" },
    { name: "Berkeley", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Seal_of_University_of_California%2C_Berkeley.svg" },
    { name: "Cornell", logo: "https://upload.wikimedia.org/wikipedia/commons/4/47/Cornell_University_seal.svg" },
    { name: "Duke", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e6/Duke_University_logo.svg" },
];

// Infinite Marquee Component
function LogoMarquee() {
    const marqueeRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!marqueeRef.current || !containerRef.current) return;

        // Fade in animation
        gsap.fromTo(containerRef.current,
            { opacity: 0, y: 20 },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "power3.out",
                delay: 0.5
            }
        );

        // Infinite scroll animation
        const marquee = marqueeRef.current;
        const totalWidth = marquee.scrollWidth / 2;

        gsap.to(marquee, {
            x: -totalWidth,
            duration: 30,
            ease: "none",
            repeat: -1,
        });

    }, []);

    return (
        <div
            ref={containerRef}
            className="w-full max-w-5xl mx-auto overflow-hidden opacity-0"
        >
            {/* Label */}
            <p className="text-center text-text-secondary text-sm mb-6 tracking-wide uppercase">
                Trusted by founders from top business schools
            </p>

            {/* Marquee container with fade edges */}
            <div className="relative">
                {/* Left progressive blur fade */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none backdrop-blur-md"
                    style={{
                        maskImage: 'linear-gradient(to right, black 0%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to right, black 0%, transparent 100%)'
                    }}
                />
                {/* Right progressive blur fade */}
                <div
                    className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none backdrop-blur-md"
                    style={{
                        maskImage: 'linear-gradient(to left, black 0%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to left, black 0%, transparent 100%)'
                    }}
                />

                {/* Scrolling logos */}
                <div ref={marqueeRef} className="flex items-center gap-20 whitespace-nowrap py-4">
                    {/* Duplicate logos for seamless loop */}
                    {[...businessSchools, ...businessSchools].map((school, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-4 flex-shrink-0 px-2"
                        >
                            <img
                                src={school.logo}
                                alt={school.name}
                                className="h-12 w-auto object-contain opacity-50 invert hover:opacity-80 transition-all duration-300"
                            />
                            <span className="text-text-secondary text-base font-medium">
                                {school.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Floating particle component
function FloatingParticles() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const particleCount = 50;
        const particles: HTMLDivElement[] = [];

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement("div");
            const size = Math.random() * 4 + 1;
            const isGlow = Math.random() > 0.7;

            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: ${isGlow ? 'rgba(251, 255, 80, 0.8)' : 'rgba(255, 255, 255, 0.4)'};
                box-shadow: ${isGlow ? '0 0 10px rgba(251, 255, 80, 0.5)' : 'none'};
                pointer-events: none;
            `;

            container.appendChild(particle);
            particles.push(particle);

            const startX = Math.random() * 100;
            const startY = Math.random() * 100;

            gsap.set(particle, {
                left: `${startX}%`,
                top: `${startY}%`,
                opacity: 0,
            });

            const tl = gsap.timeline({ repeat: -1, delay: Math.random() * 5 });

            tl.to(particle, {
                opacity: Math.random() * 0.6 + 0.2,
                duration: Math.random() * 2 + 1,
                ease: "power1.inOut",
            })
                .to(particle, {
                    y: -Math.random() * 200 - 100,
                    x: (Math.random() - 0.5) * 100,
                    duration: Math.random() * 8 + 6,
                    ease: "none",
                }, 0)
                .to(particle, {
                    opacity: 0,
                    duration: 2,
                    ease: "power1.inOut",
                }, "-=2");
        }

        return () => {
            particles.forEach(p => p.remove());
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 overflow-hidden pointer-events-none"
        />
    );
}

// Glowing orbs that float around
function GlowingOrbs() {
    const orbsRef = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        orbsRef.current.forEach((orb, i) => {
            if (!orb) return;

            gsap.to(orb, {
                x: `random(-50, 50)`,
                y: `random(-30, 30)`,
                scale: `random(0.8, 1.2)`,
                duration: `random(4, 8)`,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                delay: i * 0.5,
            });

            gsap.to(orb, {
                opacity: `random(0.3, 0.7)`,
                duration: `random(2, 4)`,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                delay: i * 0.3,
            });
        });
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
                ref={el => { orbsRef.current[0] = el }}
                className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-40"
                style={{
                    background: 'radial-gradient(circle, rgba(251, 255, 80, 0.3) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                }}
            />
            <div
                ref={el => { orbsRef.current[1] = el }}
                className="absolute top-1/3 -right-10 w-48 h-48 rounded-full opacity-30"
                style={{
                    background: 'radial-gradient(circle, rgba(88, 97, 248, 0.4) 0%, transparent 70%)',
                    filter: 'blur(30px)',
                }}
            />
            <div
                ref={el => { orbsRef.current[2] = el }}
                className="absolute bottom-1/4 left-1/4 w-32 h-32 rounded-full opacity-50"
                style={{
                    background: 'radial-gradient(circle, rgba(255, 173, 40, 0.4) 0%, transparent 70%)',
                    filter: 'blur(20px)',
                }}
            />
        </div>
    );
}

export function HeroSection() {
    const heroContentRef = useRef<HTMLDivElement>(null);

    // Text reveal animation
    useEffect(() => {
        if (!heroContentRef.current) return;

        const ctx = gsap.context(() => {
            // Animate heading lines
            const headingLines = heroContentRef.current?.querySelectorAll('.hero-heading-line');
            if (headingLines) {
                gsap.fromTo(headingLines,
                    {
                        y: 60,
                        opacity: 0,
                        clipPath: 'inset(100% 0% 0% 0%)'
                    },
                    {
                        y: 0,
                        opacity: 1,
                        clipPath: 'inset(0% 0% 0% 0%)',
                        duration: 0.8,
                        stagger: 0.15,
                        ease: "power3.out"
                    }
                );
            }

            // Animate subheading
            const subheading = heroContentRef.current?.querySelector('.hero-subheading');
            if (subheading) {
                gsap.fromTo(subheading,
                    { y: 30, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 0.7,
                        ease: "power2.out",
                        delay: 0.5
                    }
                );
            }

            // Animate buttons
            const buttons = heroContentRef.current?.querySelectorAll('.hero-button');
            if (buttons) {
                gsap.fromTo(buttons,
                    { y: 20, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 0.5,
                        stagger: 0.1,
                        ease: "power2.out",
                        delay: 0.7
                    }
                );
            }
        }, heroContentRef);

        return () => ctx.revert();
    }, []);

    return (
        <section className="relative min-h-screen overflow-hidden bg-surface-0">
            {/* Lovable-style diffused circular gradient */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at 50% 100%, rgba(251, 255, 80, 0.15) 0%, rgba(212, 55, 160, 0.2) 20%, rgba(88, 97, 248, 0.2) 40%, rgba(10, 10, 10, 0) 70%)`
                }}
            />

            {/* GSAP Animated Elements */}
            <FloatingParticles />
            <GlowingOrbs />

            <div className="container relative mx-auto px-6 pt-32 pb-20">
                <div ref={heroContentRef} className="flex flex-col items-center text-center">

                    {/* Heading */}
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-text-primary leading-tight mb-6 max-w-4xl">
                        <span className="hero-heading-line block overflow-hidden">
                            <span className="block">No Investors.</span>
                        </span>
                        <span className="hero-heading-line block overflow-hidden">
                            <span className="block text-text-primary">No feedback. No clarity?</span>
                        </span>
                    </h1>

                    {/* Subheading */}
                    <p className="hero-subheading text-text-primary max-w-2xl text-xl mb-10 opacity-0">
                        Meet Pitchex — an AI pitching room where founders face real investor-style questions, refine their story, and sharpen their ideas before it matters.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
                        <Button size="lg" asChild className="hero-button opacity-0">
                            <Link href="/sign-up" className="gap-2">
                                Start Pitching for Free
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild className="hero-button opacity-0">
                            <Link href="/demo">
                                Book a demo
                            </Link>
                        </Button>
                    </div>

                    {/* Logo Marquee */}
                    <LogoMarquee />

                </div>
            </div>
        </section>
    );
}
