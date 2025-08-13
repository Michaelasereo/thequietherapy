import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, TrendingUp, Clock, Calendar, Video, Mic, MicOff, Phone } from "lucide-react"

export default function HeroSection() {
  return (
    <section className="w-full py-16 md:py-24 lg:py-32 xl:py-40 bg-white">
      <div className="container px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_400px] lg:gap-16 xl:grid-cols-[1fr_450px] items-center max-w-6xl mx-auto">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-black">
                <span className="w-2 h-2 bg-black rounded-full"></span>
                Top Therapy Platform
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl xl:text-6xl text-black leading-tight">
                Your Journey to Mental Well-being Starts Here,
                <span className="text-[#A66B24]"> your mental health.</span>
              </h1>
              <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                Connect with compassionate, licensed therapists from the comfort of your home. Personalized care,
                flexible scheduling, and a secure platform.
              </p>
            </div>
            <div className="flex flex-col gap-3 min-[400px]:flex-row">
              <Button asChild size="lg" className="bg-black text-white hover:bg-gray-800 rounded-xl px-8 py-4 text-lg">
                <Link href="/signup">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl px-8 py-4 text-lg">
                <Link href="#about">Learn More</Link>
              </Button>
            </div>
          </div>
          
          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-2 gap-6 w-full">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Start your therapy journey</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Book your first session</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progress Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0%</div>
                <p className="text-xs text-muted-foreground">Track your progress</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Session Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">50 min</div>
                <p className="text-xs text-muted-foreground">Typical duration</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
