"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Twitter, Linkedin } from "lucide-react";

const footerLinks = {
    Product: [
        { name: "AI Pitch Practice", href: "/product/pitch-practice" },
        { name: "Feedback & Analytics", href: "/product/analytics" },
        { name: "Investor Personas", href: "/product/personas" },
    ],
    Company: [
        { name: "About", href: "/about" },
        { name: "Careers", href: "/careers" },
        { name: "Contact", href: "/contact" },
    ],
    Resources: [
        { name: "Blog", href: "/blog" },
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
    ],
};

export function Footer() {
    const footerRef = useRef<HTMLElement>(null);
    const watermarkRef = useRef<HTMLDivElement>(null);
    const particlesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!footerRef.current) return;

        const ctx = gsap.context(() => {
            // Watermark engaging animation with float effect
            if (watermarkRef.current) {
                // Initial reveal
                gsap.fromTo(watermarkRef.current,
                    { opacity: 0, y: 50, scale: 0.9 },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        duration: 1.5,
                        ease: "power3.out",
                        scrollTrigger: {
                            trigger: footerRef.current,
                            start: "top 90%",
                            toggleActions: "play none none none"
                        }
                    }
                );

                // Continuous subtle float animation
                gsap.to(watermarkRef.current, {
                    y: -15,
                    duration: 4,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    delay: 1.5
                });
            }

            // Ambient glow animation
            const glowOrbs = footerRef.current?.querySelectorAll('.footer-glow');
            if (glowOrbs) {
                glowOrbs.forEach((orb, i) => {
                    gsap.to(orb, {
                        x: `random(-30, 30)`,
                        y: `random(-20, 20)`,
                        scale: `random(0.9, 1.1)`,
                        opacity: `random(0.3, 0.6)`,
                        duration: `random(4, 7)`,
                        repeat: -1,
                        yoyo: true,
                        ease: "sine.inOut",
                        delay: i * 0.5
                    });
                });
            }

            // Link columns staggered fade-in
            const linkColumns = footerRef.current?.querySelectorAll('.footer-column');
            if (linkColumns) {
                gsap.fromTo(linkColumns,
                    { opacity: 0, y: 20 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.6,
                        stagger: 0.1,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: footerRef.current,
                            start: "top 85%",
                            toggleActions: "play none none none"
                        }
                    }
                );
            }

            // Logo section fade-in
            const logoSection = footerRef.current?.querySelector('.footer-logo');
            if (logoSection) {
                gsap.fromTo(logoSection,
                    { opacity: 0, x: -20 },
                    {
                        opacity: 1,
                        x: 0,
                        duration: 0.8,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: footerRef.current,
                            start: "top 85%",
                            toggleActions: "play none none none"
                        }
                    }
                );
            }
        }, footerRef);

        // Create floating particles
        if (particlesRef.current) {
            const container = particlesRef.current;
            const particles: HTMLDivElement[] = [];

            for (let i = 0; i < 20; i++) {
                const particle = document.createElement("div");
                const size = Math.random() * 3 + 1;

                particle.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    border-radius: 50%;
                    background: rgba(251, 255, 80, ${Math.random() * 0.4 + 0.1});
                    pointer-events: none;
                `;

                container.appendChild(particle);
                particles.push(particle);

                gsap.set(particle, {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    opacity: 0,
                });

                gsap.to(particle, {
                    opacity: Math.random() * 0.5 + 0.2,
                    y: -Math.random() * 100 - 50,
                    duration: Math.random() * 6 + 4,
                    repeat: -1,
                    delay: Math.random() * 3,
                    ease: "none"
                });
            }

            return () => {
                ctx.revert();
                particles.forEach(p => p.remove());
            };
        }

        return () => ctx.revert();
    }, []);

    return (
        <footer ref={footerRef} className="relative py-28 bg-surface-1 border-t border-surface-3 overflow-hidden">
            {/* Floating particles */}
            <div ref={particlesRef} className="absolute inset-0 pointer-events-none" />

            {/* Ambient glow orbs */}
            <div className="footer-glow absolute top-1/4 left-1/4 w-64 h-64 bg-accent-lime/10 rounded-full blur-[100px] pointer-events-none opacity-40" />
            <div className="footer-glow absolute bottom-1/4 right-1/4 w-48 h-48 bg-magenta/10 rounded-full blur-[80px] pointer-events-none opacity-30" />
            <div className="footer-glow absolute top-1/2 right-1/3 w-32 h-32 bg-purple/10 rounded-full blur-[60px] pointer-events-none opacity-30" />

            {/* Large watermark background text with gradient */}
            <div
                ref={watermarkRef}
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-0"
            >
                <span
                    className="text-[30vw] font-bold tracking-tighter leading-none"
                    style={{
                        background: 'linear-gradient(180deg, rgba(240, 240, 240, 0.08) 0%, rgba(251, 255, 80, 0.04) 50%, rgba(240, 240, 240, 0.02) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    Pitchex
                </span>
            </div>

            <div className="container relative mx-auto px-6">
                {/* Main footer content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                    {/* Logo & Description */}
                    <div className="footer-logo lg:col-span-2 space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-accent-lime flex items-center justify-center">
                                <span className="text-surface-0 font-bold text-sm">P</span>
                            </div>
                            <span className="text-xl font-semibold text-text-primary">Pitchex</span>
                        </div>
                        <p className="text-text-secondary text-sm max-w-xs leading-relaxed">
                            AI-powered pitch practice that helps founders refine their story and nail investor conversations.
                        </p>

                        {/* Badges section - optional */}
                        <div className="flex items-center gap-3 pt-4">
                            <div className="px-3 py-1 rounded-full border border-accent-lime/30 text-accent-lime text-xs">
                                SOC2 Compliant
                            </div>
                        </div>
                    </div>

                    {/* Link Columns */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category} className="footer-column space-y-4">
                            <h3 className="text-sm font-semibold text-text-primary">
                                {category}
                            </h3>
                            <ul className="space-y-3">
                                {links.map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div className="border-t border-surface-3 pt-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Copyright */}
                        <p className="text-sm text-text-tertiary">
                            © {new Date().getFullYear()} Pitchex, Inc. All rights reserved.
                        </p>

                        {/* Social Links */}
                        <div className="flex items-center gap-4">
                            <Link
                                href="https://twitter.com/pitchex"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-3 transition-all duration-200"
                            >
                                <Twitter className="w-4 h-4" />
                            </Link>
                            <Link
                                href="https://linkedin.com/company/pitchex"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-3 transition-all duration-200"
                            >
                                <Linkedin className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
