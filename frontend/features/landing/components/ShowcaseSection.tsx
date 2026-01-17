"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { Brain, Target, Shield, MessageCircle, HelpCircle, LucideIcon, Sparkles } from "lucide-react";

// Learn items with Unsplash background images
const learnItems = [
    {
        icon: Brain,
        title: "How investors think",
        description: "Understand what investors actually care about and how they evaluate pitches.",
        backgroundImage: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&q=80",
        gradient: "from-purple-900/80 via-surface-0/70 to-surface-0/90"
    },
    {
        icon: Target,
        title: "Identify weak spots",
        description: "Discover where your pitch is unclear, weak, or confusing before meeting real investors.",
        backgroundImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
        gradient: "from-blue-900/80 via-surface-0/70 to-surface-0/90"
    },
    {
        icon: Shield,
        title: "Defend under pressure",
        description: "Learn how to defend your idea under pressure and handle tough questions.",
        backgroundImage: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1200&q=80",
        gradient: "from-emerald-900/80 via-surface-0/70 to-surface-0/90"
    },
    {
        icon: MessageCircle,
        title: "Explain with clarity",
        description: "Master how to explain your startup simply and confidently in any situation.",
        backgroundImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80",
        gradient: "from-amber-900/80 via-surface-0/70 to-surface-0/90"
    },
    {
        icon: HelpCircle,
        title: "Prepare for questions",
        description: "Know exactly what questions you should be prepared to answer next.",
        backgroundImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80",
        gradient: "from-rose-900/80 via-surface-0/70 to-surface-0/90"
    }
];

// Animated Visual Component - Award-winning GSAP animation
const AnimatedVisual = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const ctx = gsap.context(() => {
            // Animate concentric rings with stagger
            const rings = containerRef.current?.querySelectorAll('.animated-ring');
            if (rings) {
                gsap.fromTo(rings,
                    { scale: 0.8, opacity: 0 },
                    {
                        scale: 1,
                        opacity: 1,
                        duration: 1.2,
                        stagger: 0.15,
                        ease: "elastic.out(1, 0.5)"
                    }
                );

                // Continuous subtle pulse animation
                gsap.to(rings, {
                    scale: 1.02,
                    duration: 2,
                    stagger: 0.2,
                    ease: "sine.inOut",
                    repeat: -1,
                    yoyo: true
                });
            }

            // Animate orbital dots
            const dots = containerRef.current?.querySelectorAll('.orbital-dot');
            if (dots) {
                dots.forEach((dot, index) => {
                    const duration = 8 + index * 2;
                    const delay = index * 0.5;

                    gsap.fromTo(dot,
                        { opacity: 0, scale: 0 },
                        { opacity: 1, scale: 1, duration: 0.6, delay: delay * 0.3, ease: "back.out(1.7)" }
                    );

                    gsap.to(dot, {
                        rotation: 360,
                        duration: duration,
                        repeat: -1,
                        ease: "none",
                        transformOrigin: "center center"
                    });
                });
            }

            // Animate connecting lines
            const lines = containerRef.current?.querySelectorAll('.connecting-line');
            if (lines) {
                gsap.fromTo(lines,
                    { scaleX: 0, opacity: 0 },
                    {
                        scaleX: 1,
                        opacity: 0.3,
                        duration: 0.8,
                        stagger: 0.1,
                        ease: "power2.out",
                        delay: 0.5
                    }
                );
            }

            // Center icon animation
            const centerIcon = containerRef.current?.querySelector('.center-icon');
            if (centerIcon) {
                gsap.fromTo(centerIcon,
                    { scale: 0, rotation: -180 },
                    { scale: 1, rotation: 0, duration: 1, ease: "back.out(1.7)", delay: 0.3 }
                );

                gsap.to(centerIcon, {
                    y: -5,
                    duration: 1.5,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut"
                });
            }

            // Animate floating particles
            const particles = containerRef.current?.querySelectorAll('.floating-particle');
            if (particles) {
                particles.forEach((particle, index) => {
                    gsap.fromTo(particle,
                        { opacity: 0 },
                        { opacity: 0.6, duration: 0.5, delay: 0.8 + index * 0.1 }
                    );

                    gsap.to(particle, {
                        y: -20 - Math.random() * 30,
                        x: (Math.random() - 0.5) * 20,
                        duration: 3 + Math.random() * 2,
                        repeat: -1,
                        yoyo: true,
                        ease: "sine.inOut",
                        delay: Math.random() * 2
                    });
                });
            }
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="relative w-full h-80 flex items-center justify-center">
            {/* Concentric Rings */}
            <div className="animated-ring absolute w-64 h-64 rounded-full border border-accent-lime/10 opacity-0" />
            <div className="animated-ring absolute w-48 h-48 rounded-full border border-accent-lime/20 opacity-0" />
            <div className="animated-ring absolute w-32 h-32 rounded-full border border-accent-lime/30 opacity-0" />

            {/* Gradient glow ring */}
            <div className="animated-ring absolute w-56 h-56 rounded-full opacity-0"
                style={{
                    background: 'conic-gradient(from 0deg, transparent, rgba(251, 255, 80, 0.1), transparent, rgba(251, 255, 80, 0.05), transparent)'
                }}
            />

            {/* Orbital dots on outer ring */}
            <div className="orbital-dot absolute w-64 h-64 opacity-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-accent-lime shadow-lg shadow-accent-lime/50" />
            </div>
            <div className="orbital-dot absolute w-48 h-48 opacity-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-green-400/80" />
            </div>
            <div className="orbital-dot absolute w-40 h-40 opacity-0">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent-lime/60" />
            </div>

            {/* Connecting lines */}
            <div className="connecting-line absolute w-32 h-px bg-gradient-to-r from-transparent via-accent-lime/30 to-transparent rotate-45 origin-center opacity-0" />
            <div className="connecting-line absolute w-32 h-px bg-gradient-to-r from-transparent via-accent-lime/30 to-transparent -rotate-45 origin-center opacity-0" />
            <div className="connecting-line absolute w-40 h-px bg-gradient-to-r from-transparent via-accent-lime/20 to-transparent rotate-12 origin-center opacity-0" />
            <div className="connecting-line absolute w-40 h-px bg-gradient-to-r from-transparent via-accent-lime/20 to-transparent -rotate-12 origin-center opacity-0" />

            {/* Floating particles - using deterministic positions to avoid hydration mismatch */}
            {[
                { top: '35%', left: '25%' },
                { top: '45%', left: '70%' },
                { top: '55%', left: '35%' },
                { top: '40%', left: '55%' },
                { top: '60%', left: '45%' },
                { top: '50%', left: '75%' },
            ].map((pos, i) => (
                <div
                    key={i}
                    className="floating-particle absolute w-1 h-1 rounded-full bg-accent-lime/40 opacity-0"
                    style={pos}
                />
            ))}


        </div>
    );
};


// Animated Left Side Content
const LeftSideContent = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const ctx = gsap.context(() => {
            // Animate badge
            const badge = containerRef.current?.querySelector('.content-badge');
            if (badge) {
                gsap.fromTo(badge,
                    { y: -10, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
                );
            }

            // Animate heading with split text effect
            const headingWords = containerRef.current?.querySelectorAll('.heading-word');
            if (headingWords) {
                gsap.fromTo(headingWords,
                    { y: 40, opacity: 0, rotationX: -45 },
                    {
                        y: 0,
                        opacity: 1,
                        rotationX: 0,
                        duration: 0.8,
                        stagger: 0.1,
                        ease: "power3.out",
                        delay: 0.2
                    }
                );
            }

            // Animate description
            const description = containerRef.current?.querySelector('.content-description');
            if (description) {
                gsap.fromTo(description,
                    { y: 20, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", delay: 0.6 }
                );
            }
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="space-y-6">


            {/* Heading with word animation */}
            <h2 className="text-3xl md:text-4xl font-semibold leading-tight overflow-hidden">
                <span className="heading-word inline-block text-accent-lime opacity-0">What&nbsp;</span>
                <span className="heading-word inline-block text-accent-lime opacity-0">you'll&nbsp;</span>
                <span className="heading-word inline-block text-text-primary opacity-0">learn</span>
            </h2>

            {/* Description */}
            <p className="content-description text-text-secondary max-w-md leading-relaxed opacity-0">
                Practice with AI that simulates real investor conversations — get actionable feedback to refine your pitch before the real thing.
            </p>
        </div>
    );
};

// Slider Slide Component
interface SlideProps {
    item: {
        icon: LucideIcon;
        title: string;
        description: string;
        backgroundImage: string;
        gradient: string;
    };
    isActive: boolean;
}

const Slide = ({ item, isActive }: SlideProps) => {
    const slideRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!slideRef.current) return;

        if (isActive) {
            gsap.fromTo(slideRef.current,
                { opacity: 0, scale: 1.05 },
                { opacity: 1, scale: 1, duration: 0.8, ease: "power3.out" }
            );

            // Animate content
            const content = slideRef.current.querySelector('.slide-content');
            if (content) {
                gsap.fromTo(content,
                    { opacity: 0, y: 30 },
                    { opacity: 1, y: 0, duration: 0.6, delay: 0.3, ease: "power2.out" }
                );
            }
        }
    }, [isActive]);

    return (
        <div
            ref={slideRef}
            className={`absolute inset-0 transition-opacity duration-500 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${item.backgroundImage})` }}
            />

            {/* Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t ${item.gradient}`} />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-0/60 to-transparent" />

            {/* Content */}
            <div className="slide-content relative h-full flex flex-col justify-end p-8 md:p-12">
                <div className="flex items-start gap-5 mb-6">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-surface-1/80 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                        <item.icon className="w-7 h-7 text-accent-lime" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-2xl md:text-3xl font-semibold text-text-primary mb-3">
                            {item.title}
                        </h3>
                        <p className="text-base md:text-lg text-text-secondary leading-relaxed max-w-md">
                            {item.description}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Benefits Slider Component
const BenefitsSlider = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const progressRef = useRef<NodeJS.Timeout | null>(null);

    const SLIDE_DURATION = 5000; // 5 seconds per slide
    const PROGRESS_INTERVAL = 50; // Update progress every 50ms

    const goToSlide = useCallback((index: number) => {
        setActiveIndex(index);
        setProgress(0);
    }, []);

    const nextSlide = useCallback(() => {
        setActiveIndex((prev) => (prev + 1) % learnItems.length);
        setProgress(0);
    }, []);

    useEffect(() => {
        // Auto-advance slides
        intervalRef.current = setInterval(nextSlide, SLIDE_DURATION);

        // Progress bar animation
        progressRef.current = setInterval(() => {
            setProgress((prev) => {
                const newProgress = prev + (100 / (SLIDE_DURATION / PROGRESS_INTERVAL));
                return newProgress >= 100 ? 0 : newProgress;
            });
        }, PROGRESS_INTERVAL);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (progressRef.current) clearInterval(progressRef.current);
        };
    }, [nextSlide]);

    // Reset timer when manually changing slides
    const handleSlideClick = (index: number) => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (progressRef.current) clearInterval(progressRef.current);

        goToSlide(index);

        intervalRef.current = setInterval(nextSlide, SLIDE_DURATION);
        progressRef.current = setInterval(() => {
            setProgress((prev) => {
                const newProgress = prev + (100 / (SLIDE_DURATION / PROGRESS_INTERVAL));
                return newProgress >= 100 ? 0 : newProgress;
            });
        }, PROGRESS_INTERVAL);
    };

    return (
        <div className="relative h-full min-h-[600px] overflow-hidden rounded-r-3xl lg:rounded-l-none rounded-3xl">
            {/* Slides */}
            {learnItems.map((item, index) => (
                <Slide key={index} item={item} isActive={activeIndex === index} />
            ))}

            {/* Progress Indicators */}
            <div className="absolute bottom-8 left-8 right-8 z-20">
                <div className="flex gap-2">
                    {learnItems.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => handleSlideClick(index)}
                            className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
                            aria-label={`Go to slide ${index + 1}`}
                        >
                            <div
                                className="h-full bg-accent-lime rounded-full transition-all duration-100"
                                style={{
                                    width: activeIndex === index ? `${progress}%` : index < activeIndex ? '100%' : '0%',
                                }}
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* Slide Counter */}
            <div className="absolute top-8 right-8 z-20">
                <div className="px-3 py-1.5 rounded-full bg-surface-1/80 backdrop-blur-sm border border-white/10">
                    <span className="text-sm font-medium text-text-primary">
                        {String(activeIndex + 1).padStart(2, '0')} / {String(learnItems.length).padStart(2, '0')}
                    </span>
                </div>
            </div>
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

                        {/* Left Side - Animated Visual & Content */}
                        <div className="relative p-8 md:p-12 flex flex-col justify-between bg-gradient-to-br from-surface-1 to-surface-2">
                            {/* Animated Visual */}
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <AnimatedVisual />
                            </div>

                            {/* Title Content with Animations */}
                            <LeftSideContent />
                        </div>

                        {/* Right Side - Animated Benefits Slider */}
                        <BenefitsSlider />

                    </div>
                </div>
            </div>
        </section>
    );
}
