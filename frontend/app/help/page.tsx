"use client"

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { ChevronDown, Mail, MessageSquare, FileText, Users, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FAQItem {
  question: string
  answer: string
  isOpen: boolean
}

export default function HelpPage() {
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
        <div className="min-h-screen bg-surface-0 p-20">
          {/* Header */}
          <div className="max-w-4xl flex gap-4 mx-auto mb-12">
            {/* Back Button */}
            <Button
              variant="secondary"
              onClick={() => window.history.back()}
              
            >
              <ArrowLeft className="w-8 h-8" />
             
            </Button>
             <div>
                <h1 className="text-4xl font-bold text-text-primary mb-2">Help & Support</h1>
                <p className="text-lg text-text-secondary">
                  Get answers to common questions and learn how to make the most of Pitchex
                </p>
              </div>

            
          </div>

          {/* Quick Stats */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stat Card 1 */}
              <div className="bg-accent-lime/10 border border-accent-lime/30 rounded-xl p-6 flex flex-col justify-between min-h-[140px]">
                <Users className="w-6 h-6 text-accent-lime mb-8" />
                <div>
                  <p className="text-2xl font-bold text-text-primary">1000+</p>
                  <p className="text-sm text-text-secondary">Active Users</p>
                </div>
              </div>

              {/* Stat Card 2 */}
              <div className="bg-accent-lime/10 border border-accent-lime/30 rounded-xl p-6 flex flex-col justify-between min-h-[140px]">
                <MessageSquare className="w-6 h-6 text-accent-lime mb-8" />
                <div>
                  <p className="text-2xl font-bold text-text-primary">5000+</p>
                  <p className="text-sm text-text-secondary">Practice Sessions</p>
                </div>
              </div>

              {/* Stat Card 3 */}
              <div className="bg-accent-lime/10 border border-accent-lime/30 rounded-xl p-6 flex flex-col justify-between min-h-[140px]">
                <FileText className="w-6 h-6 text-accent-lime mb-8" />
                <div>
                  <p className="text-2xl font-bold text-text-primary">24/7</p>
                  <p className="text-sm text-text-secondary">AI Support</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div id="faq" className="max-w-4xl mx-auto mb-12 scroll-mt-8">
            <div className="bg-surface-2 rounded-xl border border-surface-3 overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-text-primary">Frequently Asked Questions</h2>
                <p className="text-text-secondary mt-1">Find answers to the most common questions about Pitchex</p>
              </div>
              <div className="p-6 space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-surface-2 border border-surface-3 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-3/30 transition-colors"
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
                      <div className="px-4 pb-4 text-text-secondary border-t border-surface-3 pt-4">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-surface-2 rounded-xl border border-surface-3 overflow-hidden">
              <div className="p-6 border-b border-surface-3">
                <h2 className="text-2xl font-bold text-text-primary">Still Need Help?</h2>
                <p className="text-text-secondary mt-1">Our team is here to assist you</p>
              </div>
              <div className="p-6">
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

                  <div className="pt-6 border-t border-surface-3">
                    <p className="text-sm text-text-secondary">
                      <strong className="text-text-primary">Response Time:</strong> We typically respond within 24 hours on business days
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
