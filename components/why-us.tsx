import Image from "next/image"
import { CheckCircle } from "lucide-react"
import { whyUsBenefits } from "@/lib/data"

export default function WhyUs() {
  return (
    <section id="about" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px] items-center">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Why Choose Trpi?</h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                We are committed to providing a supportive and effective therapy experience.
              </p>
            </div>
            <ul className="grid gap-4 py-4">
              {whyUsBenefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-lg">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <Image
            src="/placeholder.svg?height=400&width=550"
            width={550}
            height={400}
            alt="Why Us Image"
            className="mx-auto aspect-[3/2] overflow-hidden rounded-xl object-cover sm:w-full"
          />
        </div>
      </div>
    </section>
  )
}
