import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { faqs } from "@/lib/data"

export default function FAQSection() {
  return (
    <section id="faqs" className="w-full py-16 md:py-24 lg:py-32 bg-white">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl text-black">Frequently Asked Questions</h2>
            <p className="max-w-[900px] text-gray-600 text-lg md:text-xl leading-relaxed">
              Find answers to common questions about Quiet and our services.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-4xl py-16">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-gray-200 rounded-2xl px-6">
                <AccordionTrigger className="text-left text-lg font-semibold text-black hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-base leading-relaxed pb-6">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
