import Image from "next/image";
import { CheckCircle } from 'lucide-react';

export function BenefitsSection() {
    return (
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
    );
}
