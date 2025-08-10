import LandingNavbar from "@/components/landing-navbar"
import HeroSection from "@/components/hero-section"
import CoreServices from "@/components/core-services"
import WhyUs from "@/components/why-us"
import ReviewsSection from "@/components/reviews-section"
import FAQSection from "@/components/faq-section"
import Footer from "@/components/footer"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <LandingNavbar />
      <main className="flex-1">
        <HeroSection />
        <CoreServices />
        <WhyUs />
        <ReviewsSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  )
}
