import Link from "next/link";
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
    return (
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
                        <Link href="/sign-in">
                            <Button
                                size="lg"
                                className="bg-white text-[var(--orange-accent)] hover:bg-white/90 px-8 py-6 text-lg font-semibold"
                            >
                                Get Started Free
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
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
    );
}
