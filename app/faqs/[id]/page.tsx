"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, HelpCircle, Users, CreditCard, Shield, Video, Clock } from "lucide-react"
import LandingNavbar from "@/components/landing-navbar"

// FAQ data (same as main FAQs page)
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

export default function IndividualFAQPage() {
  const params = useParams()
  const faqId = params.id as string
  
  const currentFAQ = faqData.find(faq => faq.id === faqId)
  
  if (!currentFAQ) {
    return (
      <div className="min-h-screen bg-white">
        <LandingNavbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">FAQ Not Found</h1>
            <p className="text-gray-600 mb-6">The FAQ you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/faqs">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to FAQs
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/faqs" className="inline-flex items-center text-[#A66B24] hover:text-[#8B5A1F] mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to FAQs
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* FAQ Content */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="text-xs">
                {currentFAQ.category}
              </Badge>
              <div className="flex items-center text-xs text-gray-500">
                {getCategoryIcon(currentFAQ.category)}
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-black">
              {currentFAQ.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed text-lg mb-6">
                {currentFAQ.answer}
              </p>
              
              <div className="flex gap-2 flex-wrap mb-6">
                {currentFAQ.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Related FAQs */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Related Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqData
              .filter(faq => faq.category === currentFAQ.category && faq.id !== currentFAQ.id)
              .slice(0, 4)
              .map((faq) => (
                <Card key={faq.id} className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-4">
                    <Link href={`/faqs/${faq.id}`} className="block">
                      <h4 className="font-semibold text-black hover:text-[#A66B24] transition-colors mb-2">
                        {faq.question}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {faq.answer}
                      </p>
                    </Link>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12 text-center">
          <Button asChild variant="outline">
            <Link href="/faqs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All FAQs
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
