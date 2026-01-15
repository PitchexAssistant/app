"use client";

import {
  Navbar,
  HeroSection,
  FeaturesSection,
  ShowcaseSection,
  PricingSection,
  BenefitsSection,
  CTASection,
  Footer
} from '@/features/landing';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ShowcaseSection />
        <PricingSection />
        <BenefitsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}