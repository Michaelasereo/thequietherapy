import type { Metadata } from "next"
import LandingNavbar from "@/components/landing-navbar"
import Footer from "@/components/footer"

export const metadata: Metadata = {
  title: "Campaigns - Quiet Therapy",
  description: "Join our specialized mental health campaigns for students and healthcare professionals. Get targeted support for your unique challenges.",
}

export default function CampaignsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <LandingNavbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
