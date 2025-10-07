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
              {/* Row 1 - Mental Health in Nigeria Images */}
              <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                <div className="text-blue-600 text-2xl">🧠</div>
              </div>
              <div className="aspect-square bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                <div className="text-green-600 text-2xl">💚</div>
              </div>
              <div className="aspect-square bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                <div className="text-purple-600 text-2xl">🤝</div>
              </div>
              <div className="aspect-square bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                <div className="text-orange-600 text-2xl">🌱</div>
              </div>
              <div className="aspect-square bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl flex items-center justify-center">
                <div className="text-pink-600 text-2xl">💪</div>
              </div>
              <div className="aspect-square bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center">
                <div className="text-indigo-600 text-2xl">🌟</div>
              </div>
              
              {/* Row 2 */}
              <div className="aspect-square bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl flex items-center justify-center">
                <div className="text-teal-600 text-2xl">🏥</div>
              </div>
              <div className="aspect-square bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
                <div className="text-red-600 text-2xl">❤️</div>
              </div>
              <div className="aspect-square bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center">
                <div className="text-yellow-600 text-2xl">☀️</div>
              </div>
              <div className="aspect-square bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-xl flex items-center justify-center">
                <div className="text-cyan-600 text-2xl">🌊</div>
              </div>
              <div className="aspect-square bg-gradient-to-br from-lime-100 to-lime-200 rounded-xl flex items-center justify-center">
                <div className="text-lime-600 text-2xl">🌿</div>
              </div>
              <div className="aspect-square bg-gradient-to-br from-rose-100 to-rose-200 rounded-xl flex items-center justify-center">
                <div className="text-rose-600 text-2xl">🌸</div>
              </div>
              
              {/* Row 3 */}
              <div className="aspect-square bg-gradient-to-br from-violet-100 to-violet-200 rounded-xl flex items-center justify-center">
                <div className="text-violet-600 text-2xl">🦋</div>
              </div>
              <div className="aspect-square bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center">
                <div className="text-emerald-600 text-2xl">🌳</div>
              </div>
              <div className="aspect-square bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center">
                <div className="text-amber-600 text-2xl">🔥</div>
              </div>
              <div className="aspect-square bg-gradient-to-br from-sky-100 to-sky-200 rounded-xl flex items-center justify-center">
                <div className="text-sky-600 text-2xl">☁️</div>
              </div>
              <div className="aspect-square bg-gradient-to-br from-fuchsia-100 to-fuchsia-200 rounded-xl flex items-center justify-center">
                <div className="text-fuchsia-600 text-2xl">🎭</div>
              </div>
              <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                <div className="text-slate-600 text-2xl">🕊️</div>
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
            <div className="grid lg:grid-cols-[1fr_400px] lg:gap-16 xl:grid-cols-[1fr_450px] items-start">
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
                      <Heart className="h-16 w-16 mx-auto" />
                    </div>
                  </div>
                  <div className="bg-purple-100 rounded-2xl p-8 flex items-center justify-center">
                    <div className="text-purple-600">
                      <Users className="h-16 w-16 mx-auto" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - CTA and Stats */}
              <div className="space-y-8 flex flex-col justify-end h-full">
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-4">Coming Soon</p>
                  <Button size="lg" className="bg-gray-500 text-white hover:bg-gray-600 rounded-xl px-8 py-4 text-lg cursor-not-allowed" disabled>
                    Coming Soon
                  </Button>
                </div>

                {/* Social Media Hashtags */}
                <div className="bg-gray-50 rounded-2xl p-6 mt-auto">
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
            <div className="grid lg:grid-cols-[1fr_400px] lg:gap-16 xl:grid-cols-[1fr_450px] items-start">
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
              <div className="space-y-8 flex flex-col justify-end h-full">
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-4">Coming Soon</p>
                  <Button size="lg" className="bg-gray-500 text-white hover:bg-gray-600 rounded-xl px-8 py-4 text-lg cursor-not-allowed" disabled>
                    Coming Soon
                  </Button>
                </div>

                {/* Social Media Hashtags */}
                <div className="bg-white rounded-2xl p-6 mt-auto">
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
                <p className="text-gray-700 mb-4 italic">
                  "As a final year medical student at University of Lagos, I was struggling with severe anxiety and depression. The pressure of exams, clinical rotations, and family expectations was overwhelming. I couldn't sleep, lost my appetite, and started having panic attacks. Through therapy, I learned coping strategies, breathing exercises, and how to manage my stress. Now I'm not just surviving medical school - I'm thriving. I've become a mental health advocate on campus and help other students who are struggling. Therapy saved my academic career and my life."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">AO</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Aisha O.</div>
                    <div className="text-sm text-gray-600">Final Year Medical Student, University of Lagos</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardContent className="p-6">
                <p className="text-gray-700 mb-4 italic">
                  "I'm a resident doctor at Lagos University Teaching Hospital, and the burnout was real. Working 80+ hours a week, dealing with inadequate resources, and the emotional toll of patient care was crushing me. I was drinking too much, snapping at my family, and felt like I was drowning. Therapy helped me set boundaries, develop healthy coping mechanisms, and remember why I became a doctor. Now I'm not just surviving residency - I'm actually enjoying medicine again. I've learned to care for myself so I can better care for my patients."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">DT</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Dr. Tunde A.</div>
                    <div className="text-sm text-gray-600">Resident Doctor, Lagos University Teaching Hospital</div>
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
              <Button size="lg" className="bg-gray-500 text-white hover:bg-gray-600 rounded-xl px-8 py-4 text-lg cursor-not-allowed" disabled>
                <Heart className="mr-2 h-5 w-5" />
                Coming Soon
              </Button>
              <Button size="lg" className="bg-gray-500 text-white hover:bg-gray-600 rounded-xl px-8 py-4 text-lg cursor-not-allowed" disabled>
                <Stethoscope className="mr-2 h-5 w-5" />
                Coming Soon
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
