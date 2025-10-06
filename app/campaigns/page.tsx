import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  GraduationCap, 
  Stethoscope, 
  Users, 
  Heart, 
  TrendingUp, 
  Shield, 
  Clock,
  ArrowRight,
  Star,
  CheckCircle
} from "lucide-react"
import Link from "next/link"

export default function CampaignsPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 xl:py-40 bg-white">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-black mb-6">
              <span className="w-2 h-2 bg-black rounded-full"></span>
              Specialized Programs
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl xl:text-6xl text-black leading-tight mb-6">
              Mental Health
              <span className="text-[#A66B24]"> Campaigns</span>
            </h1>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
              Join targeted therapy programs designed for specific communities. 
              Get specialized mental health support from therapists who understand your unique challenges.
            </p>
          </div>
          
          {/* Hero Image Grid */}
          <div className="mt-16 max-w-6xl mx-auto">
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Row 1 */}
              <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              </div>
              <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              </div>
              <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              </div>
              <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              </div>
              <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              </div>
              <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              </div>
              
              {/* Row 2 */}
              <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              </div>
              <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              </div>
              <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              </div>
              <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              </div>
              <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              </div>
              <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              </div>
              
              {/* Row 3 */}
              <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              </div>
              <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              </div>
              <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              </div>
              <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              </div>
              <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              </div>
              <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              </div>
            </div>
            
            {/* Text overlay or caption */}
            <div className="text-center mt-8">
              <p className="text-lg text-gray-600 font-medium">
                Join thousands of people who have found healing and support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Students in Therapy Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-[1fr_400px] lg:gap-16 xl:grid-cols-[1fr_450px] items-center">
              {/* Left Side - Content */}
              <div className="space-y-8">
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold tracking-tight sm:text-5xl xl:text-6xl text-black leading-tight">
                    Break The Stigma On
                    <span className="block text-[#A66B24]">Student Mental Health</span>
                  </h2>
                  <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                    Join thousands of students who have found healing and support through our specialized therapy programs. 
                    Get the help you need to thrive academically and personally.
                  </p>
                </div>

                {/* Content Blocks */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-black rounded-2xl p-8 flex items-center justify-center">
                    <div className="text-white">
                      <GraduationCap className="h-16 w-16 mx-auto" />
                    </div>
                  </div>
                  <div className="bg-purple-100 rounded-2xl p-8 flex items-center justify-center">
                    <div className="text-purple-600">
                      <Heart className="h-16 w-16 mx-auto" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - CTA and Stats */}
              <div className="space-y-8">
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-4">Join 500+ students already healing</p>
                  <Button asChild size="lg" className="bg-black text-white hover:bg-gray-800 rounded-xl px-8 py-4 text-lg">
                    <Link href="/signup?campaign=students">
                      See If You Qualify
                    </Link>
                  </Button>
                </div>

                {/* Social Media Hashtags */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Your Story</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">#StudentsInTherapy</Badge>
                    <Badge variant="outline" className="text-xs">#MentalHealthMatters</Badge>
                    <Badge variant="outline" className="text-xs">#StudentWellness</Badge>
                    <Badge variant="outline" className="text-xs">#AcademicMentalHealth</Badge>
                    <Badge variant="outline" className="text-xs">#TherapyWorks</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Healthcare Professionals Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-gray-50">
        <div className="container px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-[1fr_400px] lg:gap-16 xl:grid-cols-[1fr_450px] items-center">
              {/* Left Side - Content */}
              <div className="space-y-8">
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold tracking-tight sm:text-5xl xl:text-6xl text-black leading-tight">
                    Heal The Healers
                    <span className="block text-[#A66B24]">Healthcare Professional Support</span>
                  </h2>
                  <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                    Join hundreds of healthcare professionals who have found healing and support through our specialized therapy programs. 
                    Get the help you need to continue caring for others while caring for yourself.
                  </p>
                </div>

                {/* Content Blocks */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-black rounded-2xl p-8 flex items-center justify-center">
                    <div className="text-white">
                      <Stethoscope className="h-16 w-16 mx-auto" />
                    </div>
                  </div>
                  <div className="bg-blue-100 rounded-2xl p-8 flex items-center justify-center">
                    <div className="text-blue-600">
                      <Shield className="h-16 w-16 mx-auto" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - CTA and Stats */}
              <div className="space-y-8">
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-4">Join 300+ professionals already healing</p>
                  <Button asChild size="lg" className="bg-black text-white hover:bg-gray-800 rounded-xl px-8 py-4 text-lg">
                    <Link href="/signup?campaign=doctors">
                      See If You Qualify
                    </Link>
                  </Button>
                </div>

                {/* Social Media Hashtags */}
                <div className="bg-white rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Your Story</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">#HealthcareProfessionals</Badge>
                    <Badge variant="outline" className="text-xs">#DoctorsInTherapy</Badge>
                    <Badge variant="outline" className="text-xs">#NurseMentalHealth</Badge>
                    <Badge variant="outline" className="text-xs">#HealthcareBurnout</Badge>
                    <Badge variant="outline" className="text-xs">#MedicalWellness</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl text-black">Why Choose Our Programs?</h2>
              <p className="max-w-[600px] text-gray-600 text-lg md:text-xl leading-relaxed">
                Specialized mental health programs designed by experts who understand your unique challenges
              </p>
            </div>
          </div>
          
          <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                <Users className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-3">Community-Focused</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Therapists who specialize in your specific challenges and understand your community's unique needs and experiences.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                <Shield className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-3">Proven Results</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Evidence-based approaches with high success rates and measurable outcomes for all program participants.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                <Heart className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-3">Ongoing Support</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Continuous support with peer groups, resources, and follow-up care to ensure lasting positive change.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl text-black">Success Stories</h2>
              <p className="max-w-[600px] text-gray-600 text-lg md:text-xl leading-relaxed">
                Hear from people who transformed their mental health through our specialized programs
              </p>
            </div>
          </div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "As a medical student, I was struggling with anxiety and imposter syndrome. 
                  The Students in Therapy program connected me with a therapist who understood 
                  the unique pressures of medical education. I'm now more confident and focused."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">SM</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Sarah M.</div>
                    <div className="text-sm text-gray-600">Medical Student</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "After 15 years in emergency medicine, I was experiencing severe burnout. 
                  The Healthcare Professionals program provided me with tools and support to 
                  rediscover my passion for medicine while maintaining my mental health."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">DR</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Dr. Robert K.</div>
                    <div className="text-sm text-gray-600">Emergency Physician</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6">
          <div className="text-center bg-gray-50 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ready to Join a Campaign?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Take the first step towards better mental health with our specialized support programs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-black text-white hover:bg-gray-800 rounded-xl px-8 py-4 text-lg">
                <Link href="/signup?campaign=students">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Join Students Campaign
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl px-8 py-4 text-lg">
                <Link href="/signup?campaign=doctors">
                  <Stethoscope className="mr-2 h-5 w-5" />
                  Join Doctors Campaign
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
