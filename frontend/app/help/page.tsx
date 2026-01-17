"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronDown, Mail, MessageSquare, FileText, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FAQItem {
  question: string
  answer: string
  isOpen: boolean
}

export default function HelpPage() {
  const router = useRouter()
  const { user } = useUser()
  const [faqs, setFaqs] = useState<FAQItem[]>([
    {
      question: "What is Pitchex?",
      answer: "Pitchex is an AI-powered pitch coaching platform that helps entrepreneurs and founders practice and perfect their investor pitches. We use advanced emotion analysis and real-time feedback to help you deliver compelling presentations.",
      isOpen: false
    },
    {
      question: "How does the Live Session work?",
      answer: "Live Sessions connect you with our AI investor Marcus Sterling in real-time. You can practice your pitch, answer Q&A questions, or negotiate terms while receiving instant feedback on your delivery, emotion, and content.",
      isOpen: false
    },
    {
      question: "What's the difference between Record and Live modes?",
      answer: "Record mode lets you practice your pitch at your own pace, then receive detailed analysis. Live mode provides real-time interaction with AI feedback as you speak, simulating an actual investor meeting.",
      isOpen: false
    },
    {
      question: "How accurate is the emotion analysis?",
      answer: "Our emotion analysis uses state-of-the-art AI models trained on thousands of pitch presentations. While no system is perfect, we provide reliable insights into confidence, enthusiasm, nervousness, and other key emotional indicators that impact pitch success.",
      isOpen: false
    },
    {
      question: "Can I upload context documents?",
      answer: "Yes! You can upload pitch decks, business plans, or other relevant documents. Our AI will use this context to provide more relevant and personalized feedback tailored to your specific business.",
      isOpen: false
    },
    {
      question: "How are my sessions saved?",
      answer: "All your practice sessions are automatically saved to your account. You can review past sessions, track your progress over time, and see how your pitch has improved.",
      isOpen: false
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use industry-standard encryption and security practices. Your pitches, documents, and personal information are stored securely and never shared with third parties.",
      isOpen: false
    },
    {
      question: "Can I practice different types of pitches?",
      answer: "Yes! You can practice full presentations (Pitch mode), handle investor questions (Q&A mode), or negotiate terms and valuation (Negotiation mode). Each mode is optimized for that specific scenario.",
      isOpen: false
    },
    {
      question: "What kind of feedback will I receive?",
      answer: "You'll receive comprehensive feedback on your content, delivery, emotion, pacing, and structure. We analyze your word choice, confidence levels, and provide specific suggestions for improvement.",
      isOpen: false
    },
    {
      question: "How do I get started?",
      answer: "Simply sign up for an account, click 'New Session' from the dashboard, and choose your practice mode. You can start with a Live Session for immediate coaching or Record mode to practice at your own pace.",
      isOpen: false
    }
  ])

  const toggleFaq = (index: number) => {
    setFaqs(prev => prev.map((faq, i) => ({
      ...faq,
      isOpen: i === index ? !faq.isOpen : faq.isOpen
    })))
  }

  // Handle anchor navigation (e.g., /help#faq)
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      // Small delay to ensure the DOM is ready
      setTimeout(() => {
        const element = document.querySelector(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: user?.fullName || user?.firstName || 'User',
          email: user?.primaryEmailAddress?.emailAddress || '',
          avatar: user?.imageUrl || ''
        }}
      />
      <SidebarInset>
        <div className="min-h-screen bg-surface-0 p-8">
          {/* Header */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-start gap-4 mb-2">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-text-primary" />
              </button>
            <div className="flex flex-col items-start gap-4 mb-2">

            <h1 className="text-4xl font-bold text-text-primary">Help & Support</h1>
            <p className="text-lg text-text-primary">
              Get answers to common questions and learn how to make the most of Pitchex
            </p>
            </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-accent-lime/10 border-accent-lime/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent-lime/20 rounded-lg">
                      <Users className="w-6 h-6 text-accent-lime" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-primary">1000+</p>
                      <p className="text-sm text-text-secondary">Active Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-accent-lime/10 border-accent-lime/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent-lime/20 rounded-lg">
                      <MessageSquare className="w-6 h-6 text-accent-lime" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-primary">5000+</p>
                      <p className="text-sm text-text-secondary">Practice Sessions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-accent-lime/10 border-accent-lime/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent-lime/20 rounded-lg">
                      <FileText className="w-6 h-6 text-accent-lime" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-primary">24/7</p>
                      <p className="text-sm text-text-secondary">AI Support</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Section */}
          <div id="faq" className="max-w-4xl bg-surface-1 mx-auto mb-12 scroll-mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
                <CardDescription>Find answers to the most common questions about Pitchex</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-border rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center bg-surface-2 justify-between p-4 text-left hover:bg-surface-3 transition-colors"
                    >
                      <span className="font-medium text-text-primary">{faq.question}</span>
                      <ChevronDown
                        className={cn(
                          "w-5 h-5 text-text-secondary transition-transform",
                          faq.isOpen && "transform rotate-180"
                        )}
                      />
                    </button>
                    {faq.isOpen && (
                      <div className="px-4 pb-4 text-text-secondary border-t border-surface-2 pt-4">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Contact Section */}
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Still Need Help?</CardTitle>
                <CardDescription>Our team is here to assist you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-accent-lime" />
                      Contact Our Team
                    </h3>
                    <p className="text-text-secondary mb-4">
                      Have a specific question or need personalized support? Reach out to our team via email:
                    </p>
                    <div className="space-y-2">
                      <a
                        href="mailto:bscs22115@itu.edu.pk"
                        className="block text-accent-lime hover:text-accent-lime/80 transition-colors"
                      >
                        bscs22115@itu.edu.pk
                      </a>
                      <a
                        href="mailto:bscs22071@itu.edu.pk"
                        className="block text-accent-lime hover:text-accent-lime/80 transition-colors"
                      >
                        bscs22071@itu.edu.pk
                      </a>
                      <a
                        href="mailto:bscs22025@itu.edu.pk"
                        className="block text-accent-lime hover:text-accent-lime/80 transition-colors"
                      >
                        bscs22025@itu.edu.pk
                      </a>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-surface-2">
                    <p className="text-sm text-text-secondary">
                      <strong className="text-text-primary">Response Time:</strong> We typically respond within 24 hours on business days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
