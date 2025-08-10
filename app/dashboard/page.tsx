"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Video, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import { dashboardSummaryCards, upcomingSessions, mockUser } from "@/lib/data"
import Link from "next/link"
import SummaryCard from "@/components/summary-card" // Import the new SummaryCard
import BookingDashboardModal from "@/components/booking-dashboard-modal" // Import the new modal
import { useAuth } from "@/context/auth-context" // Import useAuth hook

function Video(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
    </svg>
  )
}

export default function DashboardPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false) // State for booking modal
  const { profile, loading } = useAuth() // Use the auth context
  const [showWelcome, setShowWelcome] = useState(false)

  // Check if user came from email verification
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('verified') === 'true') {
      setShowWelcome(true)
      // Remove the parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    
    // Show welcome message if user is not authenticated (came from email link)
    if (!profile && !loading) {
      setShowWelcome(true)
    }
  }, [profile, loading])

  return (
    <div className="grid gap-6">
      {showWelcome && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">Welcome to Trpi! Your account has been created successfully.</span>
          </div>
          <p className="text-green-700 text-sm mt-1">
            {profile ? 
              "You can now book sessions and manage your therapy journey." :
              "Please sign in to access your full dashboard features."
            }
          </p>
          {!profile && (
            <div className="mt-3">
              <Button onClick={() => window.location.href = '/auth'} className="bg-green-600 hover:bg-green-700">
                Sign In to Continue
              </Button>
            </div>
          )}
        </div>
      )}
      
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome, {loading ? 'Loading...' : profile?.full_name || 'User'}!
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm text-muted-foreground">
            {profile?.user_type || 'Individual'}
          </p>
          {profile?.is_verified && <CheckCircle className="h-4 w-4 text-green-500" />}
        </div>
        {profile && (
          <p className="text-sm text-muted-foreground mt-1">
            Credits: {profile.credits} • Package: {profile.package_type}
          </p>
        )}
      </div>

      {/* Summary Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardSummaryCards.map((card, index) => (
          <SummaryCard
            key={index}
            title={card.title}
            value={card.value}
            description={card.description}
            icon={card.icon}
          />
        ))}
      </div>



      {/* Upcoming Sessions and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center gap-4 p-3 rounded-md bg-muted/50">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                    <div className="grid gap-0.5">
                      <p className="font-medium">
                        {format(new Date(session.date), "PPP")} at {session.time}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.therapist} • {session.topic}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto bg-transparent" asChild>
                      <a href="#" target="_blank" rel="noopener noreferrer">
                        <Video className="mr-2 h-4 w-4" /> Join Session
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No upcoming sessions.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Session Calendar</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
          </CardContent>
        </Card>
      </div>

      {/* Notifications / Important Updates section */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Notifications & Important Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-muted-foreground">
            <p>• Reminder: Your next session is scheduled for September 15th.</p>
            <p>• New feature: Enhanced session notes are now available.</p>
            <p>• Platform update: Scheduled maintenance on October 5th, 2 AM - 4 AM UTC.</p>
          </div>
        </CardContent>
      </Card>

      {/* Booking Modal */}
      <BookingDashboardModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} />
    </div>
  )
}
