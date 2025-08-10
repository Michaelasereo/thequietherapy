import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-r from-purple-50 to-indigo-50">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_550px] lg:gap-12 xl:grid-cols-[1fr_600px] items-center">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Your Journey to Mental Well-being Starts Here.
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Connect with compassionate, licensed therapists from the comfort of your home. Personalized care,
                flexible scheduling, and a secure platform.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button asChild size="lg">
                <Link href="/book">Book a Session</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#about">Learn More</Link>
              </Button>
            </div>
          </div>
          <Image
            src="/placeholder.svg?height=400&width=600"
            width={600}
            height={400}
            alt="Hero Image"
            className="mx-auto aspect-[3/2] overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
          />
        </div>
      </div>
    </section>
  )
}
