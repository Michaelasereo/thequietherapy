import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
// FAQ data - Healthcare professional focused
const faqs = [
  {
    question: "What makes Quiet different for healthcare professionals?",
    answer:
      "Quiet is specifically designed for healthcare professionals and medical students, with therapists who understand the unique challenges of medical practice, including burnout, stress, and the demanding nature of healthcare work.",
  },
  {
    question: "How do I book a therapy session as a medical student?",
    answer:
      "Medical students can book sessions by clicking 'Book a Session' on our homepage and following the process: provide your information, select a therapist who specializes in medical student counseling, and complete checkout with flexible payment options.",
  },
  {
    question: "Are therapy sessions confidential for doctors and medical professionals?",
    answer:
      "Yes, all sessions are strictly confidential with HIPAA-compliant privacy protection. We understand the sensitive nature of healthcare professional mental health and ensure complete confidentiality.",
  },
  {
    question: "What types of therapy do you offer for healthcare workers?",
    answer:
      "We offer specialized therapy including CBT, physician wellness programs, medical student counseling, doctor burnout therapy, stress management, and peer support groups specifically designed for healthcare professionals.",
  },
  {
    question: "Can I choose a therapist who understands medical practice?",
    answer:
      "Yes, our platform allows you to browse therapist profiles and filter by specialization in healthcare professional therapy, medical student counseling, and physician wellness to find the right match for your needs.",
  },
]

export default function FAQSection() {
  return (
    <section id="faqs" className="w-full py-16 md:py-24 lg:py-32 bg-white">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl text-black">Frequently Asked Questions</h2>
            <p className="max-w-[900px] text-gray-600 text-lg md:text-xl leading-relaxed">
              Find answers to common questions about Quiet's mental health services for healthcare professionals and medical students.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-4xl py-16">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.slice(0, 4).map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-gray-200 rounded-2xl px-6">
                <AccordionTrigger className="text-left text-lg font-semibold text-black hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-base leading-relaxed pb-6">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          {/* View All FAQs Button */}
          <div className="text-center mt-8">
            <Button asChild className="bg-black hover:bg-gray-800">
              <Link href="/faqs">
                View All FAQs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
