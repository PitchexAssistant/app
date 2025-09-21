"use client";

import Image from "next/image";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { StickyCard002 } from '@/components/ui/skiper-ui/skiper17';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, CheckCircle, Zap, Users, Target, TrendingUp } from 'lucide-react';

const showcaseCards = [
  {
    id: 1,
    image: "/Home-1.png",
    alt: "Pitchex Dashboard - Transform your ideas into winning pitches",
  },
  {
    id: 2,
    image: "/live-session-ready-1.png",
    alt: "Live Session Ready - Real-time collaboration and feedback",
  },
  {
    id: 3,
    image: "/live-session-start.png",
    alt: "Live Session Active - Dynamic pitch presentation mode",
  },
];

const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: "AI-Powered Insights",
    description: "Get intelligent feedback and suggestions to strengthen your pitch with cutting-edge AI technology."
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Real-Time Collaboration",
    description: "Work together with your team in live sessions, sharing ideas and refining your pitch instantly."
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: "Targeted Practice",
    description: "Practice with industry-specific scenarios and get feedback tailored to your audience and market."
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Performance Analytics",
    description: "Track your progress with detailed analytics and insights to continuously improve your pitching skills."
  }
];

export default function Home() {
  const router = useRouter();

  const handleGetStarted = useCallback(() => {
    router.push("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-6 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  Turn Ideas Into
                  <span className="text-[var(--orange-accent)]"> Winning Pitches</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Master the art of pitching with AI-powered insights, real-time collaboration, 
                  and industry-specific practice sessions. Transform your ideas into compelling 
                  presentations that win.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={handleGetStarted}
                  className="bg-[var(--orange-accent)] hover:bg-[var(--orange-accent)]/90 text-white px-8 py-6 text-lg"
                >
                  Start Pitching Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="px-8 py-6 text-lg"
                >
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold">10K+</div>
                  <div className="text-sm text-muted-foreground">Successful Pitches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">95%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">500+</div>
                  <div className="text-sm text-muted-foreground">Companies</div>
                </div>
              </div>
            </div>

            
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Everything You Need to Pitch Like a Pro
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From AI-powered feedback to real-time collaboration, Pitchex provides 
              all the tools you need to create winning pitches.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 bg-background/50 backdrop-blur-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--orange-accent)]/10 flex items-center justify-center text-[var(--orange-accent)]">
                    {feature.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20 bg-muted/30" style={{ height: "300vh" }}>
      
              <div className="h-[800px] w-full">
                <StickyCard002 cards={showcaseCards} />
              </div>
           
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold">
                  Why Choose Pitchex?
                </h2>
                <p className="text-xl text-muted-foreground">
                  Join thousands of entrepreneurs, startups, and professionals who have 
                  transformed their pitching game with Pitchex.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-[var(--orange-accent)] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg">AI-Powered Feedback</h3>
                    <p className="text-muted-foreground">Get instant, intelligent feedback on your pitch content, delivery, and structure.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-[var(--orange-accent)] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg">Industry-Specific Training</h3>
                    <p className="text-muted-foreground">Practice with scenarios tailored to your industry and target audience.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-[var(--orange-accent)] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg">Real-Time Collaboration</h3>
                    <p className="text-muted-foreground">Work with your team in live sessions to refine and perfect your pitch.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <Image
                src="/Home-1.png"
                alt="Pitchex Logo"
                width={500}
                height={500}
                className="w-full h-auto opacity-80"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[var(--orange-accent)]">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Ready to Transform Your Pitches?
            </h2>
            <p className="text-xl text-white/90">
              Join thousands of successful entrepreneurs who have mastered the art of pitching with Pitchex.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-white text-[var(--orange-accent)] hover:bg-white/90 px-8 py-6 text-lg font-semibold"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-white hover:text-[var(--orange-accent)] px-8 py-6 text-lg"
              >
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}