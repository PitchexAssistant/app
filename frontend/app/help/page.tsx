"use client"

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, Mail, MessageSquare, FileText, Users } from 'lucide-react'
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
        <div className="min-h-screen bg-[#171717] p-8">
          {/* Header */}
          <div className="max-w-4xl mx-auto mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Help & Support</h1>
            <p className="text-lg text-gray-400">
              Get answers to common questions and learn how to make the most of Pitchex
            </p>
          </div>

          {/* Quick Stats */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-[#FF6B00]/20 to-[#FF6B00]/5 border-[#FF6B00]/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#FF6B00]/20 rounded-lg">
                      <Users className="w-6 h-6 text-[#FF6B00]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">1000+</p>
                      <p className="text-sm text-gray-400">Active Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#FF6B00]/20 to-[#FF6B00]/5 border-[#FF6B00]/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#FF6B00]/20 rounded-lg">
                      <MessageSquare className="w-6 h-6 text-[#FF6B00]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">5000+</p>
                      <p className="text-sm text-gray-400">Practice Sessions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#FF6B00]/20 to-[#FF6B00]/5 border-[#FF6B00]/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#FF6B00]/20 rounded-lg">
                      <FileText className="w-6 h-6 text-[#FF6B00]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">24/7</p>
                      <p className="text-sm text-gray-400">AI Support</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
                <CardDescription>Find answers to the most common questions about Pitchex</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-zinc-800 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-900/50 transition-colors"
                    >
                      <span className="font-medium text-white">{faq.question}</span>
                      <ChevronDown
                        className={cn(
                          "w-5 h-5 text-gray-400 transition-transform",
                          faq.isOpen && "transform rotate-180"
                        )}
                      />
                    </button>
                    {faq.isOpen && (
                      <div className="px-4 pb-4 text-gray-400 border-t border-zinc-800 pt-4">
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
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-[#FF6B00]" />
                      Contact Our Team
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Have a specific question or need personalized support? Reach out to our team via email:
                    </p>
                    <div className="space-y-2">
                      <a
                        href="mailto:bscs22115@itu.edu.pk"
                        className="block text-[#FF6B00] hover:text-[#FF8533] transition-colors"
                      >
                        bscs22115@itu.edu.pk
                      </a>
                      <a
                        href="mailto:bscs22071@itu.edu.pk"
                        className="block text-[#FF6B00] hover:text-[#FF8533] transition-colors"
                      >
                        bscs22071@itu.edu.pk
                      </a>
                      <a
                        href="mailto:bscs22025@itu.edu.pk"
                        className="block text-[#FF6B00] hover:text-[#FF8533] transition-colors"
                      >
                        bscs22025@itu.edu.pk
                      </a>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-800">
                    <p className="text-sm text-gray-400">
                      <strong className="text-white">Response Time:</strong> We typically respond within 24 hours on business days
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
