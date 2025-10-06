"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search, ArrowRight, HelpCircle, Users, CreditCard, Shield, Video, Clock } from "lucide-react"
import LandingNavbar from "@/components/landing-navbar"

// Enhanced FAQ data with categories
const faqData = [
  {
    id: "1",
    question: "How does Quiet's therapy platform work?",
    answer: "Quiet connects you with licensed therapists through secure video sessions. Simply sign up, browse available therapists, book a session, and meet with your therapist online. All sessions are conducted through our HIPAA-compliant platform.",
    category: "Getting Started",
    tags: ["Platform", "How it works", "Video sessions"]
  },
  {
    id: "2",
    question: "What qualifications do your therapists have?",
    answer: "All our therapists are licensed mental health professionals with advanced degrees in psychology, counseling, or social work. They have completed rigorous training and maintain active licenses in their respective states.",
    category: "Therapists",
    tags: ["Qualifications", "Licensed", "Professional"]
  },
  {
    id: "3",
    question: "How much do therapy sessions cost?",
    answer: "Sessions are priced at $10 per credit, with most sessions requiring 1 credit. We offer various credit packages to suit different needs, and you can purchase credits as needed.",
    category: "Pricing",
    tags: ["Cost", "Credits", "Pricing"]
  },
  {
    id: "4",
    question: "Is my information secure and private?",
    answer: "Yes, we take your privacy seriously. Our platform is HIPAA-compliant and uses bank-level encryption to protect your data. All sessions are confidential and your information is never shared without your consent.",
    category: "Privacy & Security",
    tags: ["Privacy", "Security", "HIPAA", "Confidentiality"]
  },
  {
    id: "5",
    question: "Can I choose my own therapist?",
    answer: "Yes, you can browse our network of therapists and choose one that best fits your needs. You can filter by specialization, availability, and read their profiles before making a selection.",
    category: "Therapists",
    tags: ["Selection", "Choice", "Browse"]
  },
  {
    id: "6",
    question: "What if I need to cancel or reschedule a session?",
    answer: "You can cancel or reschedule sessions up to 24 hours before your appointment without any penalty. Late cancellations may result in a credit being used. We understand that life happens and try to be flexible.",
    category: "Scheduling",
    tags: ["Cancellation", "Reschedule", "Policy"]
  },
  {
    id: "7",
    question: "Do you accept insurance?",
    answer: "Currently, we operate on a self-pay basis using our credit system. This allows us to provide consistent, high-quality care without the limitations of insurance networks. We're working on insurance partnerships for the future.",
    category: "Pricing",
    tags: ["Insurance", "Self-pay", "Payment"]
  },
  {
    id: "8",
    question: "What types of therapy do you offer?",
    answer: "We offer various therapeutic approaches including Cognitive Behavioral Therapy (CBT), Dialectical Behavior Therapy (DBT), psychodynamic therapy, and more. Our therapists specialize in areas like anxiety, depression, relationships, trauma, and stress management.",
    category: "Services",
    tags: ["Therapy types", "CBT", "Specializations"]
  },
  {
    id: "9",
    question: "How long are therapy sessions?",
    answer: "Standard therapy sessions are 50 minutes long, which is the traditional therapy hour. This allows enough time for meaningful work while respecting your schedule.",
    category: "Scheduling",
    tags: ["Duration", "Session length", "Time"]
  },
  {
    id: "10",
    question: "Can I use Quiet if I'm in crisis?",
    answer: "If you're experiencing a mental health crisis, please contact emergency services immediately (911) or call the National Suicide Prevention Lifeline at 988. While we provide ongoing therapy, we're not equipped for crisis intervention.",
    category: "Emergency",
    tags: ["Crisis", "Emergency", "Safety"]
  },
  {
    id: "11",
    question: "What technology do I need for video sessions?",
    answer: "You'll need a device with a camera and microphone (computer, tablet, or smartphone), a stable internet connection, and a private space for your session. Our platform works on all major browsers and devices.",
    category: "Technical",
    tags: ["Technology", "Requirements", "Video"]
  },
  {
    id: "12",
    question: "How do I know if therapy is working for me?",
    answer: "Therapy progress varies for each person. You might notice improved mood, better coping skills, reduced symptoms, or enhanced relationships. Regular check-ins with your therapist help track progress and adjust treatment as needed.",
    category: "Getting Started",
    tags: ["Progress", "Effectiveness", "Results"]
  }
]

const categories = ["All", "Getting Started", "Therapists", "Pricing", "Privacy & Security", "Scheduling", "Services", "Emergency", "Technical"]

export default function FAQsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Getting Started":
        return <HelpCircle className="h-5 w-5" />
      case "Therapists":
        return <Users className="h-5 w-5" />
      case "Pricing":
        return <CreditCard className="h-5 w-5" />
      case "Privacy & Security":
        return <Shield className="h-5 w-5" />
      case "Scheduling":
        return <Clock className="h-5 w-5" />
      case "Services":
        return <Video className="h-5 w-5" />
      case "Emergency":
        return <HelpCircle className="h-5 w-5" />
      case "Technical":
        return <HelpCircle className="h-5 w-5" />
      default:
        return <HelpCircle className="h-5 w-5" />
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Online Therapy & Mental Health FAQs
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get answers to common questions about online therapy, mental health counseling, and our licensed therapist services
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className="text-sm"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* FAQs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredFAQs.map((faq) => (
            <Card key={faq.id} className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
              <Link href={`/faqs/${faq.id}`} className="block">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {faq.category}
                    </Badge>
                    <div className="flex items-center text-xs text-gray-500">
                      {getCategoryIcon(faq.category)}
                    </div>
                  </div>
                  <CardTitle className="text-lg text-black hover:text-[#A66B24] transition-colors">
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 leading-relaxed mb-4 line-clamp-3">
                    {faq.answer}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {faq.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>

        {filteredFAQs.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Still have questions?</h3>
              <p className="text-gray-600 mb-6">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-black hover:bg-gray-800">
                  <Link href="/contact">
                    Contact Support
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/book">
                    Book a Session
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
