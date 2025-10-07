import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// Pain points data - Real challenges facing Nigerian medical students and doctors
const testimonials = [
  {
    quote:
      "The pressure in medical school is overwhelming. Between long study hours, clinical rotations, and the fear of failing, many of us struggle with anxiety and depression. We need accessible mental health support.",
    location: "Lagos, Nigeria",
    title: "Medical Student, Lagos University",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    quote:
      "As a resident doctor, I work 80+ hours a week with little support. The burnout is real, and there's no one to talk to about the stress. Mental health resources for doctors in Nigeria are severely lacking.",
    location: "Abuja, Nigeria",
    title: "Resident Doctor, National Hospital",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    quote:
      "The healthcare system in Nigeria is under immense pressure. We're dealing with inadequate resources, long hours, and the emotional toll of patient care. Many doctors are struggling silently with their mental health.",
    location: "Kano, Nigeria",
    title: "Consultant Physician, Aminu Kano Teaching Hospital",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

export default function ReviewsSection() {
  return (
    <section className="w-full py-16 md:py-24 lg:py-32 bg-white">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl text-black">Trusted by Healthcare Professionals!</h2>
            <p className="max-w-[900px] text-gray-600 text-lg md:text-xl leading-relaxed">
              We're just starting out so no reviews yet, but what people are saying in terms of pain points. We understand the real challenges facing Nigerian medical students and doctors.
            </p>
          </div>
        </div>
        
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3 md:grid-cols-2">
          {/* Pain Point 1 */}
          <Card className="p-8 bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
            <CardContent className="flex flex-col gap-6">
              <div className="text-4xl font-bold text-black">"</div>
              <p className="text-lg text-black leading-relaxed">
                The pressure in medical school is overwhelming. Between long study hours, clinical rotations, and the fear of failing, many of us struggle with anxiety and depression. We need accessible mental health support.
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-gray-200">
                  <AvatarImage src="/placeholder.svg" alt="Medical Student" />
                  <AvatarFallback className="bg-gray-100 text-gray-700">MS</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-black">Medical Student, Lagos University</p>
                  <p className="text-sm text-gray-600">Lagos, Nigeria</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pain Point 2 */}
          <Card className="p-8 bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
            <CardContent className="flex flex-col gap-6">
              <div className="text-4xl font-bold text-black">"</div>
              <p className="text-lg text-black leading-relaxed">
                As a resident doctor, I work 80+ hours a week with little support. The burnout is real, and there's no one to talk to about the stress. Mental health resources for doctors in Nigeria are severely lacking.
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-gray-200">
                  <AvatarImage src="/placeholder.svg" alt="Resident Doctor" />
                  <AvatarFallback className="bg-gray-100 text-gray-700">RD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-black">Resident Doctor, National Hospital</p>
                  <p className="text-sm text-gray-600">Abuja, Nigeria</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pain Point 3 */}
          <Card className="p-8 bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
            <CardContent className="flex flex-col gap-6">
              <div className="text-4xl font-bold text-black">"</div>
              <p className="text-lg text-black leading-relaxed">
                The healthcare system in Nigeria is under immense pressure. We're dealing with inadequate resources, long hours, and the emotional toll of patient care. Many doctors are struggling silently with their mental health.
              </p>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-gray-200">
                  <AvatarImage src="/placeholder.svg" alt="Consultant Physician" />
                  <AvatarFallback className="bg-gray-100 text-gray-700">CP</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-black">Consultant Physician, Aminu Kano Teaching Hospital</p>
                  <p className="text-sm text-gray-600">Kano, Nigeria</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </section>
  )
}
