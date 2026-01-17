"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Mail, Twitter, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";

// Footer content constants
const FOOTER_CONTENT = {
    TITLE_LINE_1: "Ready to perfect",
    TITLE_LINE_2: "your pitch?",
    SUBTITLE: "Join thousands of founders who are closing deals faster.",
    EMAIL_PLACEHOLDER: "Enter your email",
    SUBSCRIBE_BUTTON: "Subscribe",
    PRIVACY_NOTE: "We respect your privacy. Unsubscribe anytime.",
    COPYRIGHT: `© ${new Date().getFullYear()} Pitchex, Inc. All rights reserved.`,
};

// Footer navigation links
const FOOTER_LINKS = {
    PRODUCT: {
        title: "Product",
        links: [
            { name: "AI Pitch Practice", href: "/product/pitch-practice" },
            { name: "Feedback & Analytics", href: "/product/analytics" },
            { name: "Investor Personas", href: "/product/personas" },
        ],
    },
    TOOLS: {
        title: "Tools",
        links: [
            { name: "Pitch Deck Builder", href: "/tools/deck-builder" },
            { name: "Investor CRM", href: "/tools/crm" },
            { name: "Q&A Library", href: "/tools/qa-library" },
        ],
    },
    COMPANY: {
        title: "Company",
        links: [
            { name: "About", href: "/about" },
            { name: "Careers", href: "/careers" },
            { name: "Contact", href: "/contact" },
        ],
    },
    LEGAL: {
        title: "Legal",
        links: [
            { name: "Privacy Policy", href: "/privacy" },
            { name: "Terms of Service", href: "/terms" },
            { name: "Cookie Policy", href: "/cookies" },
        ],
    },
};

interface FooterProps {
    isAuthenticated?: boolean;
}

// Floating particle component - same as HeroSection
function FloatingParticles() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const particleCount = 40;
        const particles: HTMLDivElement[] = [];

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement("div");
            const size = Math.random() * 3 + 1;
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
                    y: -Math.random() * 150 - 50,
                    x: (Math.random() - 0.5) * 80,
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

// Glowing orbs that float around - same as HeroSection but softer
function GlowingOrbs() {
    const orbsRef = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        orbsRef.current.forEach((orb, i) => {
            if (!orb) return;

            gsap.to(orb, {
                x: `random(-40, 40)`,
                y: `random(-25, 25)`,
                scale: `random(0.8, 1.2)`,
                duration: `random(5, 9)`,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                delay: i * 0.6,
            });

            gsap.to(orb, {
                opacity: `random(0.2, 0.5)`,
                duration: `random(3, 5)`,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                delay: i * 0.4,
            });
        });
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
                ref={el => { orbsRef.current[0] = el }}
                className="absolute -top-10 -left-10 w-48 h-48 rounded-full opacity-30"
                style={{
                    background: 'radial-gradient(circle, rgba(251, 255, 80, 0.2) 0%, transparent 70%)',
                    filter: 'blur(50px)',
                }}
            />
            <div
                ref={el => { orbsRef.current[1] = el }}
                className="absolute top-1/2 -right-10 w-40 h-40 rounded-full opacity-20"
                style={{
                    background: 'radial-gradient(circle, rgba(88, 97, 248, 0.3) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                }}
            />
            <div
                ref={el => { orbsRef.current[2] = el }}
                className="absolute bottom-10 left-1/3 w-32 h-32 rounded-full opacity-25"
                style={{
                    background: 'radial-gradient(circle, rgba(212, 55, 160, 0.25) 0%, transparent 70%)',
                    filter: 'blur(35px)',
                }}
            />
        </div>
    );
}

export function Footer({ isAuthenticated = false }: FooterProps) {
    const [email, setEmail] = useState("");
    const footerRef = useRef<HTMLElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Subscribe:", email);
        setEmail("");
    };

    useEffect(() => {
        if (!footerRef.current) return;

        const ctx = gsap.context(() => {
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

        return () => ctx.revert();
    }, []);

    return (
        <footer
            ref={footerRef}
            className="relative mx-auto w-full max-w-[1366px] border border-border-default bg-surface-1 my-20 rounded-3xl overflow-hidden"
        >
            {/* Soft animated hazy background gradient */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse at 30% 20%, rgba(251, 255, 80, 0.1) 0%, transparent 50%),
                                 radial-gradient(ellipse at 70% 80%, rgba(88, 97, 248, 0.1) 0%, transparent 50%),
                                 radial-gradient(ellipse at 50% 50%, rgba(212, 55, 160, 0.1) 0%, transparent 60%)`
                }}
            />

            {/* GSAP Animated Effects - same as HeroSection */}
            <FloatingParticles />
            <GlowingOrbs />

            <div className="relative px-8 md:px-16 py-12 md:py-16">
                {/* Top Section - Title and Email Form (conditional on !isAuthenticated) */}
                {!isAuthenticated && (
                    <>
                        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                            {/* Left: Title and Subtitle */}
                            <div className="flex flex-col gap-3">
                                <h2 className="text-2xl md:text-3xl font-semibold leading-tight text-text-primary">
                                    {FOOTER_CONTENT.TITLE_LINE_1}
                                    <br />
                                    <span className="text-accent-lime">
                                        {FOOTER_CONTENT.TITLE_LINE_2}
                                    </span>
                                </h2>
                                <p className="text-base text-text-secondary">
                                    {FOOTER_CONTENT.SUBTITLE}
                                </p>
                            </div>

                            {/* Right: Email Form - matching button roundness (rounded-lg) */}
                            <div className="flex flex-col gap-2 w-full md:w-auto">
                                <form
                                    onSubmit={handleSubmit}
                                    className="flex items-center gap-2 rounded-lg bg-surface-2 border border-surface-3 p-1.5"
                                >
                                    <input
                                        type="email"
                                        placeholder={FOOTER_CONTENT.EMAIL_PLACEHOLDER}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="flex-1 h-9 px-4 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none min-w-[180px] rounded-lg"
                                    />
                                    <Button type="submit" size="sm">
                                        <Mail className="h-4 w-4" />
                                        {FOOTER_CONTENT.SUBSCRIBE_BUTTON}
                                    </Button>
                                </form>
                                <p className="text-sm text-text-tertiary text-center">
                                    {FOOTER_CONTENT.PRIVACY_NOTE}
                                </p>
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="w-full h-px bg-surface-3 my-12 md:my-16" />
                    </>
                )}

                {/* Bottom Section - 5 columns with separator between 4th and 5th */}
                <div className={`flex flex-col lg:flex-row lg:justify-between gap-8 ${isAuthenticated ? "mt-0" : ""}`}>
                    {/* Column 1: Product */}
                    <div className="footer-column flex flex-col gap-5">
                        <p className="text-xs font-medium tracking-wider text-text-tertiary uppercase">
                            {FOOTER_LINKS.PRODUCT.title}
                        </p>
                        <div className="flex flex-col gap-3">
                            {FOOTER_LINKS.PRODUCT.links.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Column 2: Tools */}
                    <div className="footer-column flex flex-col gap-5">
                        <p className="text-xs font-medium tracking-wider text-text-tertiary uppercase">
                            {FOOTER_LINKS.TOOLS.title}
                        </p>
                        <div className="flex flex-col gap-3">
                            {FOOTER_LINKS.TOOLS.links.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Column 3: Company */}
                    <div className="footer-column flex flex-col gap-5">
                        <p className="text-xs font-medium tracking-wider text-text-tertiary uppercase">
                            {FOOTER_LINKS.COMPANY.title}
                        </p>
                        <div className="flex flex-col gap-3">
                            {FOOTER_LINKS.COMPANY.links.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Column 4: Legal */}
                    <div className="footer-column flex flex-col gap-5">
                        <p className="text-xs font-medium tracking-wider text-text-tertiary uppercase">
                            {FOOTER_LINKS.LEGAL.title}
                        </p>
                        <div className="flex flex-col gap-3">
                            {FOOTER_LINKS.LEGAL.links.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Vertical Separator between column 4 and 5 */}
                    <div className="hidden lg:block w-px bg-surface-3 self-stretch" />

                    {/* Column 5: Logo Section */}
                    <div className="footer-logo flex flex-col items-start gap-5">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <img
                                src="/pitchex-logo.png"
                                alt="Pitchex"
                                className="h-8 w-auto"
                            />
                        </div>

                        {/* Compliance Badges */}
                        <div className="flex items-center gap-3">
                            <img
                                src="/soc2-compliance.png"
                                alt="SOC2 Compliant"
                                className="h-10 w-auto"
                            />
                            <img
                                src="/gdpr-compliance.png"
                                alt="GDPR Compliant"
                                className="h-10 w-auto"
                            />
                        </div>


                        {/* Copyright */}
                        <p className="text-sm text-text-tertiary">
                            {FOOTER_CONTENT.COPYRIGHT}
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
