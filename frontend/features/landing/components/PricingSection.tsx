"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Check, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const pricingPlans = [
    {
        name: "Starter",
        description: "Perfect for trying out Pitchex and getting comfortable with AI pitch practice.",
        price: "Free",
        priceNote: "No credit card required",
        features: [
            "3 pitch practice sessions per month",
            "Basic AI investor questions",
            "Session summary report",
            "Email support",
            "Access to pitch templates"
        ],
        cta: "Get Started Free",
        highlighted: false,
        badge: null
    },
    {
        name: "Pro",
        description: "For founders serious about perfecting their pitch and securing funding.",
        price: "$29",
        priceNote: "/month",
        features: [
            "Unlimited pitch practice sessions",
            "Advanced investor persona selection",
            "Detailed performance analytics",
            "Real-time feedback & coaching",
            "Priority support",
            "Custom question sets",
            "Export session recordings"
        ],
        cta: "Start Pro Trial",
        highlighted: true,
        badge: "Most Popular"
    }
];

export function PricingSection() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!sectionRef.current) return;

        const ctx = gsap.context(() => {
            // Section header fade-in
            const header = sectionRef.current?.querySelector('.pricing-header');
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

            // Cards staggered fade-in
            const cards = sectionRef.current?.querySelectorAll('.pricing-card');
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
        <section ref={sectionRef} className="py-24 bg-surface-0 relative overflow-hidden">
            {/* Background glows */}
            <div className="absolute top-50 right-50 w-80 h-80 bg-accent-lime/50 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-50 left-50 w-96 h-96 bg-magenta/50 rounded-full blur-[150px] pointer-events-none" />

            <div className="container mx-auto px-6">
                {/* Section Header */}
                <div className="pricing-header text-center space-y-4 mb-16">
                    <h2 className="text-4xl md:text-5xl font-semibold text-text-primary">
                        Simple, transparent pricing
                    </h2>
                    <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                        Start free and upgrade when you're ready to take your pitch to the next level.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="relative max-w-4xl mx-auto">
                    {/* Gradient glow behind cards */}
                    <div
                        className="absolute inset-0 -inset-x-8 -inset-y-12 rounded-[40px] opacity-40 blur-3xl pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse at center, rgba(251, 255, 80, 0.15) 0%, rgba(251, 255, 80, 0.05) 40%, transparent 70%)'
                        }}
                    />

                    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6">
                        {pricingPlans.map((plan, index) => (
                            <div
                                key={index}
                                className={`pricing-card relative flex flex-col p-8 rounded-3xl border transition-all duration-300 ${plan.highlighted
                                    ? "bg-surface-1 border-accent-lime/30 shadow-2xl shadow-accent-lime/5"
                                    : "bg-surface-1 border-surface-3 hover:border-surface-3/80"
                                    }`}
                            >
                                {/* Badge */}
                                {plan.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <div className="px-4 py-1 rounded-full bg-accent-lime text-surface-0 text-xs font-semibold flex items-center gap-1.5">
                                            <Sparkles className="w-3 h-3" />
                                            {plan.badge}
                                        </div>
                                    </div>
                                )}

                                {/* Plan Header */}
                                <div className="mb-6">
                                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                                        {plan.name}
                                    </h3>
                                    <p className="text-sm text-text-secondary leading-relaxed">
                                        {plan.description}
                                    </p>
                                </div>

                                {/* Price */}
                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-4xl font-bold ${plan.highlighted ? "text-accent-lime" : "text-text-primary"}`}>
                                            {plan.price}
                                        </span>
                                        <span className="text-text-tertiary text-sm">
                                            {plan.priceNote}
                                        </span>
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="flex-1 mb-8">
                                    <ul className="space-y-3">
                                        {plan.features.map((feature, featureIndex) => (
                                            <li key={featureIndex} className="flex items-start gap-3">
                                                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${plan.highlighted
                                                    ? "bg-accent-lime/20 text-accent-lime"
                                                    : "bg-surface-2 text-text-tertiary"
                                                    }`}>
                                                    <Check className="w-3 h-3" />
                                                </div>
                                                <span className="text-sm text-text-secondary">
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* CTA Button */}
                                <Button
                                    className={`w-full py-6 rounded-xl font-semibold transition-all duration-300 ${plan.highlighted
                                        ? "bg-accent-lime text-surface-0 hover:bg-accent-lime/90"
                                        : "bg-surface-2 text-text-primary hover:bg-surface-3 border border-surface-3"
                                        }`}
                                >
                                    {plan.highlighted && <Zap className="w-4 h-4 mr-2" />}
                                    {plan.cta}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom note */}
                <p className="text-center text-text-tertiary text-sm mt-10">
                    All plans include a 14-day money-back guarantee. No questions asked.
                </p>
            </div>
        </section>
    );
}
